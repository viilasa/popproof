import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  presentPaywall as rcPresentPaywall,
  presentCustomerCenter,
  syncUserId,
  logout as rcLogout,
  ENTITLEMENTS,
  type CustomerInfo,
  type Offerings,
  type Package,
  type PurchaseResult,
  type PaywallResult,
} from '../lib/revenuecat';
import type { User } from '@supabase/supabase-js';

// ==================== Context Types ====================

interface RevenueCatContextType {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: Offerings | null;
  
  // Computed
  isPro: boolean;
  hasActiveSubscription: boolean;
  activeSubscriptions: string[];
  
  // Actions
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (pkg: Package) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<void>;
  presentPaywall: () => Promise<PaywallResult>;
  openCustomerCenter: () => Promise<void>;
  syncUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

// ==================== Context ====================

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

// ==================== Provider ====================

interface RevenueCatProviderProps {
  children: React.ReactNode;
  supabaseUser?: User | null;
}

export function RevenueCatProvider({ children, supabaseUser }: RevenueCatProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await initializeRevenueCat();
        setIsInitialized(true);
        
        // Load initial data
        await refreshData();
      } catch (error) {
        console.error('[RevenueCatProvider] Initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Sync with Supabase user when it changes
  useEffect(() => {
    if (!isInitialized || !supabaseUser) return;

    const sync = async () => {
      try {
        setIsLoading(true);
        await syncUserId(supabaseUser.id);
        await refreshData();
      } catch (error) {
        console.error('[RevenueCatProvider] User sync failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    sync();
  }, [isInitialized, supabaseUser?.id]);

  // Refresh customer info and offerings
  const refreshData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const [info, offs] = await Promise.all([
        getCustomerInfo(),
        getOfferings(),
      ]);
      
      setCustomerInfo(info);
      setOfferings(offs);
    } catch (error) {
      console.error('[RevenueCatProvider] Refresh failed:', error);
    }
  }, [isInitialized]);

  // Computed values
  const isPro = customerInfo?.entitlements.active[ENTITLEMENTS.PRO]?.isActive ?? false;
  const hasActiveSubscription = (customerInfo?.activeSubscriptions?.length ?? 0) > 0;
  const activeSubscriptions = customerInfo?.activeSubscriptions ?? [];

  // Purchase action
  const handlePurchase = useCallback(async (pkg: Package): Promise<PurchaseResult> => {
    setIsLoading(true);
    try {
      const result = await rcPurchasePackage(pkg);
      
      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore purchases
  const handleRestore = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await rcRestorePurchases();
      setCustomerInfo(info);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Present paywall
  const handlePresentPaywall = useCallback(async (): Promise<PaywallResult> => {
    setIsLoading(true);
    try {
      const result = await rcPresentPaywall();
      
      if (result.success && result.customerInfo) {
        setCustomerInfo(result.customerInfo);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open customer center
  const handleOpenCustomerCenter = useCallback(async () => {
    try {
      await presentCustomerCenter();
    } catch (error) {
      console.error('[RevenueCatProvider] Customer Center error:', error);
    }
  }, []);

  // Sync user
  const handleSyncUser = useCallback(async (user: User) => {
    if (!isInitialized) return;
    await syncUserId(user.id);
    await refreshData();
  }, [isInitialized, refreshData]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await rcLogout();
      setCustomerInfo(null);
      setOfferings(null);
    } catch (error) {
      console.error('[RevenueCatProvider] Logout error:', error);
    }
  }, []);

  const value: RevenueCatContextType = {
    isInitialized,
    isLoading,
    customerInfo,
    offerings,
    isPro,
    hasActiveSubscription,
    activeSubscriptions,
    refreshCustomerInfo: refreshData,
    purchasePackage: handlePurchase,
    restorePurchases: handleRestore,
    presentPaywall: handlePresentPaywall,
    openCustomerCenter: handleOpenCustomerCenter,
    syncUser: handleSyncUser,
    logout: handleLogout,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

// ==================== Hooks ====================

/**
 * Main hook for accessing RevenueCat context
 */
export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}

/**
 * Hook for checking Pro status
 */
export function useIsPro(): boolean {
  const { isPro } = useRevenueCat();
  return isPro;
}

/**
 * Hook for getting offerings
 */
export function useOfferings(): Offerings | null {
  const { offerings } = useRevenueCat();
  return offerings;
}

/**
 * Hook for getting customer info
 */
export function useCustomerInfo(): CustomerInfo | null {
  const { customerInfo } = useRevenueCat();
  return customerInfo;
}

/**
 * Hook for purchasing
 * Returns a tuple: [purchase function, isPurchasing]
 */
export function usePurchase(): [(pkg: Package) => Promise<PurchaseResult>, boolean] {
  const { isLoading, purchasePackage } = useRevenueCat();
  return [purchasePackage, isLoading];
}

/**
 * Hook for presenting paywall
 */
export function usePaywall(): {
  presentPaywall: () => Promise<PaywallResult>;
  isPresenting: boolean;
} {
  const { isLoading, presentPaywall } = useRevenueCat();
  return { presentPaywall, isPresenting: isLoading };
}

/**
 * Hook for customer center
 */
export function useCustomerCenter(): {
  openCustomerCenter: () => Promise<void>;
} {
  const { openCustomerCenter } = useRevenueCat();
  return { openCustomerCenter };
}
