import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: 'starter' | 'pro' | 'growth';
  price_usd: number;
  price_inr: number;
  visitor_limit: number;
  website_limit: number;
  features: string[];
}

interface Subscription {
  id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'expired' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  visitors_used: number;
  plan: Plan | null;
  trial_ends_at?: string;
}

// Feature flags - what's available in each tier
export const FEATURES = {
  // Basic features (available to all)
  BASIC_WIDGET: 'basic_widget',
  SINGLE_SITE: 'single_site',

  // Pro features (locked for trial/starter)
  MULTIPLE_SITES: 'multiple_sites',
  REMOVE_BRANDING: 'remove_branding',
  ALL_WIDGET_STYLES: 'all_widget_styles',
  PRIORITY_SUPPORT: 'priority_support',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  API_ACCESS: 'api_access',
  CUSTOM_NOTIFICATIONS: 'custom_notifications',

  // Growth features
  UNLIMITED_SITES: 'unlimited_sites',
  DEDICATED_SUPPORT: 'dedicated_support',
  SLA_GUARANTEE: 'sla_guarantee',
  WHITE_LABEL: 'white_label',
} as const;

type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

// Define what features are available for each tier
const TIER_FEATURES: Record<string, FeatureKey[]> = {
  trial: [
    FEATURES.BASIC_WIDGET,
    FEATURES.SINGLE_SITE,
  ],
  starter: [
    FEATURES.BASIC_WIDGET,
    FEATURES.SINGLE_SITE,
  ],
  pro: [
    FEATURES.BASIC_WIDGET,
    FEATURES.SINGLE_SITE,
    FEATURES.MULTIPLE_SITES,
    FEATURES.REMOVE_BRANDING,
    FEATURES.ALL_WIDGET_STYLES,
    FEATURES.PRIORITY_SUPPORT,
    FEATURES.ADVANCED_ANALYTICS,
    FEATURES.API_ACCESS,
    FEATURES.CUSTOM_NOTIFICATIONS,
  ],
  growth: [
    FEATURES.BASIC_WIDGET,
    FEATURES.SINGLE_SITE,
    FEATURES.MULTIPLE_SITES,
    FEATURES.REMOVE_BRANDING,
    FEATURES.ALL_WIDGET_STYLES,
    FEATURES.PRIORITY_SUPPORT,
    FEATURES.ADVANCED_ANALYTICS,
    FEATURES.API_ACCESS,
    FEATURES.CUSTOM_NOTIFICATIONS,
    FEATURES.UNLIMITED_SITES,
    FEATURES.DEDICATED_SUPPORT,
    FEATURES.SLA_GUARANTEE,
    FEATURES.WHITE_LABEL,
  ],
};

// Trial period in days
const TRIAL_PERIOD_DAYS = 14;

interface SubscriptionContextType {
  subscription: Subscription | null;
  plans: Plan[];
  loading: boolean;
  error: string | null;
  isPaidPlan: boolean;
  isTrialing: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  currentTier: 'starter' | 'pro' | 'growth' | 'trial' | null;
  refreshSubscription: () => Promise<void>;
  hasFeature: (feature: FeatureKey) => boolean;
  canAccessFeature: (feature: FeatureKey) => { allowed: boolean; reason?: string };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ghiobuubmnvlaukeyuwe.supabase.co';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-subscription`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setPlans(data.plans || []);
      setSubscription(data.subscription || null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Determine subscription status
  const isPaidPlan = subscription?.plan?.tier === 'pro' || subscription?.plan?.tier === 'growth';
  const isTrialing = subscription?.status === 'trialing';

  // Calculate trial days left
  const calculateTrialDaysLeft = (): number => {
    if (!subscription?.trial_ends_at && !subscription?.current_period_end) return 0;

    const endDate = new Date(subscription?.trial_ends_at || subscription?.current_period_end || '');
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysLeft = isTrialing ? calculateTrialDaysLeft() : 0;
  const isTrialExpired = isTrialing && trialDaysLeft <= 0;

  // Determine current tier (trial is treated as its own tier for feature access)
  const currentTier = (() => {
    if (isTrialing && !isTrialExpired) return 'trial';
    if (isTrialExpired) return 'starter'; // Expired trial = starter limitations
    return subscription?.plan?.tier || 'starter';
  })();

  // Check if user has access to a feature
  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    if (!currentTier) return false;
    const tierFeatures = TIER_FEATURES[currentTier] || TIER_FEATURES.starter;
    return tierFeatures.includes(feature);
  }, [currentTier]);

  // Check access with reason
  const canAccessFeature = useCallback((feature: FeatureKey): { allowed: boolean; reason?: string } => {
    if (isPaidPlan) {
      const tierFeatures = TIER_FEATURES[currentTier || 'pro'] || [];
      if (tierFeatures.includes(feature)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Upgrade to Growth plan to access this feature' };
    }

    if (isTrialing && !isTrialExpired) {
      const trialFeatures = TIER_FEATURES.trial;
      if (trialFeatures.includes(feature)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Upgrade to Pro to unlock this feature. Trial ends in ${trialDaysLeft} days.`
      };
    }

    if (isTrialExpired) {
      return { allowed: false, reason: 'Your trial has expired. Upgrade to continue using this feature.' };
    }

    // Starter/free tier
    const starterFeatures = TIER_FEATURES.starter;
    if (starterFeatures.includes(feature)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Upgrade to Pro to unlock this feature' };
  }, [currentTier, isPaidPlan, isTrialing, isTrialExpired, trialDaysLeft]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plans,
        loading,
        error,
        isPaidPlan,
        isTrialing,
        isTrialExpired,
        trialDaysLeft,
        currentTier,
        refreshSubscription: fetchSubscription,
        hasFeature,
        canAccessFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Export features for use in components
export { TIER_FEATURES };
