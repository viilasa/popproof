import { Purchases, PurchasesError, LOG_LEVEL } from '@revenuecat/purchases-js';

// RevenueCat Configuration
const REVENUECAT_API_KEY = 'test_kObBohcflOStygteSBIdqsKlfNt';
const APP_USER_ID_STORAGE_KEY = 'proofedge_rc_user_id';

// Entitlement IDs
export const ENTITLEMENTS = {
  PRO: 'proofedge Pro',
} as const;

// Offering IDs
export const OFFERINGS = {
  DEFAULT: 'default',
} as const;

// Product IDs from RevenueCat dashboard
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
  BASIC_PLAN: 'pri_01khk3bv2zv5zrk7cw02g07hww',
} as const;

let purchasesInstance: Purchases | null = null;

/**
 * Initialize RevenueCat SDK
 * Should be called once when the app starts
 */
export async function initializeRevenueCat(): Promise<Purchases> {
  if (purchasesInstance) {
    return purchasesInstance;
  }

  // Get or create anonymous user ID
  let appUserId = localStorage.getItem(APP_USER_ID_STORAGE_KEY);
  
  if (!appUserId) {
    // Generate anonymous ID if not exists
    appUserId = generateAnonymousId();
    localStorage.setItem(APP_USER_ID_STORAGE_KEY, appUserId);
  }

  try {
    // Configure RevenueCat
    purchasesInstance = Purchases.configure(
      REVENUECAT_API_KEY,
      appUserId,
      { 
        // Optional: Add any additional configuration
        // environment: 'sandbox', // For testing
      }
    );

    // Enable debug logging in development
    if (import.meta.env.DEV) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    console.log('[RevenueCat] Initialized successfully for user:', appUserId);
    return purchasesInstance;
  } catch (error) {
    console.error('[RevenueCat] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get the Purchases instance (must call initializeRevenueCat first)
 */
export function getPurchases(): Purchases {
  if (!purchasesInstance) {
    throw new Error('RevenueCat not initialized. Call initializeRevenueCat() first.');
  }
  return purchasesInstance;
}

/**
 * Get current customer info including entitlements
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  const purchases = getPurchases();
  
  try {
    const customerInfo = await purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Check if user has Pro entitlement
 */
export async function hasProEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;
  } catch (error) {
    console.error('[RevenueCat] Error checking Pro entitlement:', error);
    return false;
  }
}

/**
 * Get available offerings
 */
export async function getOfferings(): Promise<Offerings | null> {
  const purchases = getPurchases();
  
  try {
    const offerings = await purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(packageToPurchase: Package): Promise<PurchaseResult> {
  const purchases = getPurchases();
  
  try {
    const { customerInfo, redemptionInfo } = await purchases.purchase(packageToPurchase);
    
    console.log('[RevenueCat] Purchase successful:', customerInfo);
    
    return {
      success: true,
      customerInfo,
      redemptionInfo,
    };
  } catch (error) {
    console.error('[RevenueCat] Purchase failed:', error);
    
    if (error instanceof PurchasesError) {
      // User cancelled - not an actual error
      if (error.errorCode === 'PURCHASE_CANCELLED_ERROR') {
        return {
          success: false,
          cancelled: true,
          error: null,
        };
      }
    }
    
    return {
      success: false,
      cancelled: false,
      error: handleRevenueCatError(error),
    };
  }
}

/**
 * Restore purchases (for users who previously purchased)
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  const purchases = getPurchases();
  
  try {
    const customerInfo = await purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore failed:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Present RevenueCat Paywall
 * Uses the modern Paywall v2 API
 */
export async function presentPaywall(
  options?: PaywallOptions
): Promise<PaywallResult> {
  const purchases = getPurchases();
  
  try {
    // Get offerings to use with paywall
    const offerings = await getOfferings();
    const offering = options?.offeringId 
      ? offerings?.all[options.offeringId] 
      : offerings?.current;

    if (!offering) {
      throw new Error('No offerings available for paywall');
    }

    // Present the paywall
    const result = await purchases.presentPaywall({
      offering: offering,
      // Additional options can be passed here
    });

    return {
      success: true,
      customerInfo: result.customerInfo,
    };
  } catch (error) {
    console.error('[RevenueCat] Paywall presentation failed:', error);
    return {
      success: false,
      error: handleRevenueCatError(error),
    };
  }
}

/**
 * Present Customer Center
 * Allows users to manage their subscriptions
 */
export async function presentCustomerCenter(): Promise<void> {
  const purchases = getPurchases();
  
  try {
    await purchases.presentCustomerCenter();
    console.log('[RevenueCat] Customer Center presented');
  } catch (error) {
    console.error('[RevenueCat] Customer Center failed:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Sync user ID with Supabase (or other backend)
 * Call this after user logs in
 */
export async function syncUserId(supabaseUserId: string): Promise<void> {
  const purchases = getPurchases();
  
  try {
    await purchases.logIn(supabaseUserId);
    localStorage.setItem(APP_USER_ID_STORAGE_KEY, supabaseUserId);
    console.log('[RevenueCat] User ID synced:', supabaseUserId);
  } catch (error) {
    console.error('[RevenueCat] Failed to sync user ID:', error);
    throw handleRevenueCatError(error);
  }
}

/**
 * Log out user from RevenueCat
 */
export async function logout(): Promise<void> {
  const purchases = getPurchases();
  
  try {
    await purchases.logOut();
    localStorage.removeItem(APP_USER_ID_STORAGE_KEY);
    console.log('[RevenueCat] User logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout failed:', error);
    throw handleRevenueCatError(error);
  }
}

// ==================== Utility Functions ====================

/**
 * Generate anonymous user ID
 */
function generateAnonymousId(): string {
  return 'rc_anon_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Handle RevenueCat errors with user-friendly messages
 */
function handleRevenueCatError(error: unknown): Error {
  if (error instanceof PurchasesError) {
    const errorMessages: Record<string, string> = {
      'PURCHASE_CANCELLED_ERROR': 'Purchase was cancelled.',
      'PURCHASE_NOT_ALLOWED_ERROR': 'Purchases are not allowed on this device.',
      'PURCHASE_INVALID_ERROR': 'Invalid purchase. Please try again.',
      'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR': 'This product is not available for purchase.',
      'PRODUCT_ALREADY_PURCHASED_ERROR': 'You have already purchased this product.',
      'RECEIPT_ALREADY_IN_USE_ERROR': 'This receipt is already in use.',
      'INVALID_RECEIPT_ERROR': 'Invalid receipt. Please try again.',
      'MISSING_RECEIPT_FILE_ERROR': 'Missing receipt file. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
      'OFFLINE_CONNECTION_ERROR': 'You are offline. Please check your connection.',
      'CONFIGURATION_ERROR': 'Configuration error. Please contact support.',
      'UNEXPECTED_BACKEND_RESPONSE_ERROR': 'Unexpected server response. Please try again.',
      'EMPTY_SKU_LIST_ERROR': 'No products available.',
      'INVALID_SUBSCRIPTION_STATE_ERROR': 'Invalid subscription state.',
    };

    const userMessage = errorMessages[error.errorCode] || 
                       `Purchase error: ${error.message || 'Unknown error'}`;
    
    return new Error(userMessage);
  }
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error('An unexpected error occurred');
}

// ==================== Type Definitions ====================

export interface CustomerInfo {
  entitlements: {
    active: Record<string, EntitlementInfo>;
    all: Record<string, EntitlementInfo>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  firstSeen: string;
  originalAppUserId: string;
  originalPurchaseDate: string | null;
  managementURL: string | null;
  nonSubscriptionTransactions: Transaction[];
}

export interface EntitlementInfo {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: string;
  latestPurchaseDate: string;
  originalPurchaseDate: string;
  expirationDate: string | null;
  store: string;
  productIdentifier: string;
  isSandbox: boolean;
  unsubscribeDetectedAt: string | null;
  billingIssueDetectedAt: string | null;
}

export interface Transaction {
  transactionIdentifier: string;
  productIdentifier: string;
  purchaseDate: string;
}

export interface Offerings {
  current: Offering | null;
  all: Record<string, Offering>;
}

export interface Offering {
  identifier: string;
  serverDescription: string;
  availablePackages: Package[];
  lifetime: Package | null;
  annual: Package | null;
  sixMonth: Package | null;
  threeMonth: Package | null;
  twoMonth: Package | null;
  monthly: Package | null;
  weekly: Package | null;
}

export interface Package {
  identifier: string;
  packageType: string;
  product: Product;
  offeringIdentifier: string;
}

export interface Product {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  subscriptionOptions?: SubscriptionOption[];
  defaultSubscriptionOption?: SubscriptionOption;
}

export interface SubscriptionOption {
  id: string;
  priceId: string;
  storeProductId: string;
  title: string;
  description: string;
  price: Price;
  periodDuration: string;
}

export interface Price {
  formattedPrice: string;
  currencyCode: string;
  amountMicros: number;
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  customerInfo?: CustomerInfo;
  redemptionInfo?: unknown;
  error?: Error;
}

export interface PaywallOptions {
  offeringId?: string;
}

export interface PaywallResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: Error;
}
