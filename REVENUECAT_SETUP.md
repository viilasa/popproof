# RevenueCat Integration for ProofEdge

This document describes the complete RevenueCat SDK integration for the ProofEdge application.

## Files Created

1. **`src/lib/revenuecat.ts`** - Core RevenueCat SDK configuration and API
2. **`src/hooks/useRevenueCat.tsx`** - React hooks and context provider
3. **`src/components/subscription/PaywallModal.tsx`** - Paywall UI components
4. **`REVENUECAT_SETUP.md`** - This documentation

## Quick Start

### 1. Wrap your app with the provider

```tsx
// In your main App.tsx or entry point
import { RevenueCatProvider } from './hooks/useRevenueCat';

function App() {
  const { user } = useAuth(); // Your auth hook

  return (
    <RevenueCatProvider supabaseUser={user}>
      <YourAppComponents />
    </RevenueCatProvider>
  );
}
```

### 2. Check subscription status anywhere

```tsx
import { useIsPro, useRevenueCat } from './hooks/useRevenueCat';

function MyComponent() {
  const isPro = useIsPro();
  const { isLoading } = useRevenueCat();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isPro ? (
        <p>You have Pro access!</p>
      ) : (
        <p>Upgrade to Pro for more features</p>
      )}
    </div>
  );
}
```

### 3. Show the paywall

```tsx
import { useState } from 'react';
import { PaywallModal } from './components/subscription/PaywallModal';
import { useIsPro } from './hooks/useRevenueCat';

function UpgradeButton() {
  const [showPaywall, setShowPaywall] = useState(false);
  const isPro = useIsPro();

  if (isPro) return null;

  return (
    <>
      <button onClick={() => setShowPaywall(true)}>
        Upgrade to Pro
      </button>
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
    </>
  );
}
```

### 4. Open Customer Center (manage subscriptions)

```tsx
import { useCustomerCenter } from './hooks/useRevenueCat';

function ManageSubscription() {
  const { openCustomerCenter } = useCustomerCenter();

  return (
    <button onClick={openCustomerCenter}>
      Manage My Subscription
    </button>
  );
}
```

## Configuration Details

### API Key
The SDK is configured with your test API key: `test_kObBohcflOStygteSBIdqsKlfNt`

**Important**: Switch to production key before launching:
```ts
// In src/lib/revenuecat.ts
const REVENUECAT_API_KEY = 'prod_your_production_key';
```

### Entitlements
- `proofedge Pro` - Main premium entitlement

### Products
Configured products in RevenueCat dashboard:
- `monthly` - Monthly subscription
- `yearly` - Annual subscription (recommended for most users)
- `lifetime` - One-time purchase
- `pri_01khk3bv2zv5zrk7cw02g07hww` - Basic Plan

## Available Hooks

### useRevenueCat()
Main hook providing full context:
```ts
const {
  isInitialized,      // boolean - SDK initialized
  isLoading,        // boolean - loading state
  customerInfo,     // CustomerInfo | null
  offerings,        // Offerings | null
  isPro,            // boolean - has Pro entitlement
  hasActiveSubscription, // boolean
  activeSubscriptions,   // string[]
  refreshCustomerInfo,   // () => Promise<void>
  purchasePackage,       // (pkg: Package) => Promise<PurchaseResult>
  restorePurchases,      // () => Promise<void>
  presentPaywall,        // () => Promise<PaywallResult>
  openCustomerCenter,    // () => Promise<void>
  syncUser,              // (user: User) => Promise<void>
  logout,                // () => Promise<void>
} = useRevenueCat();
```

### useIsPro()
Simple Pro status check:
```ts
const isPro = useIsPro();
```

### useOfferings()
Get available subscription offerings:
```ts
const offerings = useOfferings();
```

### useCustomerInfo()
Get full customer info:
```ts
const customerInfo = useCustomerInfo();
```

### usePurchase()
Direct purchase hook:
```ts
const [purchase, isPurchasing] = usePurchase();
// purchase(package) to buy
```

### usePaywall()
Paywall presentation:
```ts
const { presentPaywall, isPresenting } = usePaywall();
```

### useCustomerCenter()
Customer Center management:
```ts
const { openCustomerCenter } = useCustomerCenter();
```

## Error Handling

The SDK handles common RevenueCat errors and provides user-friendly messages:

- `PURCHASE_CANCELLED_ERROR` - User cancelled
- `PURCHASE_NOT_ALLOWED_ERROR` - Device restriction
- `NETWORK_ERROR` - Connection issues
- `INVALID_RECEIPT_ERROR` - Receipt validation failed

All errors are logged to console with `[RevenueCat]` prefix.

## Best Practices

1. **Always wrap with Provider**: The RevenueCatProvider must wrap your app
2. **Check isPro for features**: Use `useIsPro()` to gate premium features
3. **Handle loading states**: Always check `isLoading` before showing UI
4. **Sync on login**: Provider automatically syncs when Supabase user changes
5. **Test in sandbox**: Use test API key and sandbox products for development
6. **Restore purchases**: Call `restorePurchases()` for users switching devices

## RevenueCat Dashboard Setup

Before using, ensure your RevenueCat dashboard has:

1. **App configured** with Web platform
2. **Products added**:
   - Monthly subscription
   - Yearly subscription  
   - Lifetime product
   - Basic plan
3. **Entitlement created**: `proofedge Pro`
4. **Offering created**: `default` with packages for each product
5. **Paywall configured** using RevenueCat Paywall editor

## Testing

### Sandbox Testing
1. Use test API key: `test_kObBohcflOStygteSBIdqsKlfNt`
2. Products use sandbox environment
3. No real charges occur

### Common Test Scenarios
```ts
// Test 1: Check if user has Pro
const isPro = await hasProEntitlement();

// Test 2: Get offerings
const offerings = await getOfferings();

// Test 3: Restore purchases
await restorePurchases();

// Test 4: Present paywall
await presentPaywall();
```

## Migration Notes

When switching from test to production:
1. Update API key in `src/lib/revenuecat.ts`
2. Verify products are configured in production dashboard
3. Test all purchase flows
4. Enable Google/Apple payment methods in dashboard

## Support

For RevenueCat-specific issues:
- Documentation: https://www.revenuecat.com/docs
- SDK Reference: https://www.revenuecat.com/docs/getting-started/installation/web-sdk
- Support: https://www.revenuecat.com/support
