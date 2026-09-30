import { useState, useEffect } from 'react';
import { Check, CreditCard, Calendar, Users, Globe, Zap, Crown, Clock, AlertTriangle, LifeBuoy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { useSubscription } from '../contexts/SubscriptionContext';
import { TrialBanner } from '../components/FeatureGate';
import { useDodoPayments } from '../hooks/useDodoPayments';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';

interface BillingProps {
  onNavigate?: (section: string) => void;
}

interface Payment {
  id: string;
  amount_usd: number;
  currency: string;
  status: string;
  created_at: string;
  metadata: {
    plan_name?: string;
  };
}

// Plan tier configurations for UI grouping
const PRO_TIERS = [
  { slug: 'pro-6k', visitors: '6,000', price: 9 },
  { slug: 'pro-10k', visitors: '10,000', price: 12 },
  { slug: 'pro-15k', visitors: '15,000', price: 16 },
  { slug: 'pro-25k', visitors: '25,000', price: 21 },
  { slug: 'pro-50k', visitors: '50,000', price: 36 },
];

const GROWTH_TIERS = [
  { slug: 'growth-100k', visitors: '100,000', price: 59 },
  { slug: 'growth-200k', visitors: '200,000', price: 79 },
  { slug: 'growth-400k', visitors: '400,000', price: 120 },
  { slug: 'growth-600k', visitors: '600,000', price: 180 },
  { slug: 'growth-1m', visitors: '1,000,000', price: 210 },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ghiobuubmnvlaukeyuwe.supabase.co';

export default function Billing({ onNavigate }: BillingProps) {
  const { user } = useAuth();
  const { subscription, isPaidPlan, isTrialing, trialDaysLeft, isTrialExpired, refreshSubscription } = useSubscription();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProTier, setSelectedProTier] = useState(0);
  const [selectedGrowthTier, setSelectedGrowthTier] = useState(0);
  const { createCheckout, loading: checkoutLoading, error: checkoutError } = useDodoPayments();
  const { toast, success, error: showError, hideToast } = useToast();

  // Get current plan slug to detect which tier is active
  const currentPlanSlug = subscription?.plan?.slug || 'starter';
  const currentPlanTier = subscription?.plan?.tier || 'starter';

  // Find current tier index for Pro and Growth
  const currentProTierIndex = PRO_TIERS.findIndex(t => t.slug === currentPlanSlug);
  const currentGrowthTierIndex = GROWTH_TIERS.findIndex(t => t.slug === currentPlanSlug);
  const isOnProPlan = currentPlanTier === 'pro';
  const isOnGrowthPlan = currentPlanTier === 'growth';

  // Determine button state for Pro plan
  const getProButtonState = () => {
    if (isOnProPlan && PRO_TIERS[selectedProTier].slug === currentPlanSlug) {
      return { text: 'Current Plan', disabled: true, style: 'current' };
    }
    if (isOnProPlan && selectedProTier > currentProTierIndex) {
      return { text: 'Upgrade', disabled: false, style: 'upgrade' };
    }
    if (isOnProPlan && selectedProTier < currentProTierIndex) {
      return { text: 'Downgrade', disabled: false, style: 'downgrade' };
    }
    if (isOnGrowthPlan) {
      return { text: 'Downgrade to Pro', disabled: false, style: 'downgrade' };
    }
    return { text: 'Upgrade to Pro', disabled: false, style: 'upgrade' };
  };

  // Determine button state for Growth plan
  const getGrowthButtonState = () => {
    if (isOnGrowthPlan && GROWTH_TIERS[selectedGrowthTier].slug === currentPlanSlug) {
      return { text: 'Current Plan', disabled: true, style: 'current' };
    }
    if (isOnGrowthPlan && selectedGrowthTier > currentGrowthTierIndex) {
      return { text: 'Upgrade', disabled: false, style: 'upgrade' };
    }
    if (isOnGrowthPlan && selectedGrowthTier < currentGrowthTierIndex) {
      return { text: 'Downgrade', disabled: false, style: 'downgrade' };
    }
    return { text: 'Upgrade to Growth', disabled: false, style: 'upgrade' };
  };

  const proButtonState = getProButtonState();
  const growthButtonState = getGrowthButtonState();

  // Plan chosen on the landing page: start checkout once the subscription has loaded
  useEffect(() => {
    if (!user || !subscription) return;
    let slug: string | null = null;
    try {
      slug = sessionStorage.getItem('proofedge_checkout_plan');
      if (slug) sessionStorage.removeItem('proofedge_checkout_plan');
    } catch {
      return;
    }
    if (!slug) return;
    const proIdx = PRO_TIERS.findIndex(t => t.slug === slug);
    const growthIdx = GROWTH_TIERS.findIndex(t => t.slug === slug);
    if (proIdx === -1 && growthIdx === -1) return;
    if (proIdx !== -1) setSelectedProTier(proIdx);
    if (growthIdx !== -1) setSelectedGrowthTier(growthIdx);
    if (slug !== currentPlanSlug) createCheckout(slug);
  }, [user, subscription, currentPlanSlug, createCheckout]);

  // Handle checkout errors
  useEffect(() => {
    if (checkoutError) {
      showError(checkoutError);
    }
  }, [checkoutError, showError]);

  // Handle successful payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const plan = urlParams.get('plan');
    
    if (payment === 'success') {
      success(`Successfully upgraded to ${plan || 'new plan'}!`);
      window.history.replaceState({}, '', window.location.pathname);
      // The webhook may land a few seconds after the redirect, so re-check a few times
      refreshSubscription();
      const timers = [3000, 8000, 15000].map((ms) => setTimeout(() => refreshSubscription(), ms));
      return () => timers.forEach(clearTimeout);
    }
  }, [success, refreshSubscription]);

  // Fetch payment history
  useEffect(() => {
    fetchPaymentHistory();
  }, [user]);

  const fetchPaymentHistory = async () => {
    if (!user) return;

    setLoading(true);

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

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatVisitors = (limit: number) => {
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(0)}M`;
    if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
    return limit.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentPlan = subscription?.plan;
  const isFreePlan = currentPlan?.tier === 'starter' || !currentPlan;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Trial Banner */}
      <TrialBanner />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your subscription and billing details</p>
      </div>

      {/* Trial Status Card */}
      {isTrialing && (
        <div className={`rounded-xl border-2 p-6 ${isTrialExpired
          ? 'bg-red-50 border-red-200'
          : trialDaysLeft <= 3
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isTrialExpired
              ? 'bg-red-100'
              : trialDaysLeft <= 3
                ? 'bg-amber-100'
                : 'bg-blue-100'
              }`}>
              {isTrialExpired ? (
                <AlertTriangle className="w-7 h-7 text-red-600" />
              ) : (
                <Clock className="w-7 h-7 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {isTrialExpired ? 'Trial Expired' : `${trialDaysLeft} Days Left in Trial`}
              </h3>
              <p className="text-gray-600">
                {isTrialExpired
                  ? 'Upgrade now to continue using premium features'
                  : 'You have access to basic features. Upgrade to unlock all features.'}
              </p>
            </div>
            <a
              href="#plans"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isFreePlan ? 'bg-gray-100' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                }`}>
                {isFreePlan ? (
                  <Users className="w-7 h-7 text-gray-600" />
                ) : (
                  <Crown className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{currentPlan?.name || 'Starter'}</h3>
                <p className="text-gray-500">
                  {isFreePlan ? 'Free forever' : `$${currentPlan?.price_usd}/month`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  <span>Visitors</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {subscription?.visitors_used?.toLocaleString() || 0} / {formatVisitors(currentPlan?.visitor_limit || 1000)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Globe className="w-4 h-4" />
                  <span>Websites</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {currentPlan?.website_limit === -1 ? 'Unlimited' : currentPlan?.website_limit || 1}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Renews</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {isFreePlan ? 'Never' : formatDate(subscription?.current_period_end || '')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Zap className="w-4 h-4" />
                  <span>Status</span>
                </div>
                <p className={`font-semibold ${subscription?.status === 'active' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                  {subscription?.status === 'active' ? 'Active' : subscription?.status || 'Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Upgrade Plans */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isFreePlan ? 'Upgrade Your Plan' : 'Change Plan'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Choose the plan that fits your needs</p>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className={`rounded-xl border-2 p-6 ${isFreePlan ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
            }`}>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Starter</h3>
            <p className="text-gray-500 text-sm mb-4">For testing & small sites</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> 1 Website
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> 1,000 visitors/month
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> Basic widget styles
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> ProofEdge branding
              </li>
            </ul>
            {isFreePlan ? (
              <button disabled className="w-full py-2 rounded-lg bg-blue-100 text-blue-600 font-medium">
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => onNavigate?.('support')}
                className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <LifeBuoy className="w-4 h-4" />
                Contact Support
              </button>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`rounded-xl border-2 p-6 relative ${isOnProPlan ? 'border-emerald-500 bg-gray-900 ring-2 ring-emerald-500/20' : 'border-gray-900 bg-gray-900'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {isOnProPlan ? '✓ YOUR PLAN' : 'MOST POPULAR'}
            </div>
            <h3 className="text-xl font-bold mb-1 text-white">Pro</h3>
            <p className="text-sm mb-4 text-gray-400">For growing businesses</p>

            <div className="mb-3">
              <span className="text-3xl font-bold text-white">
                ${PRO_TIERS[selectedProTier].price}
              </span>
              <span className="text-gray-400">/month</span>
            </div>

            {/* Tier selector */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                <span>Monthly visitors</span>
                <span className="text-blue-400 font-semibold">{PRO_TIERS[selectedProTier].visitors}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 p-1 bg-gray-800/50 rounded-lg">
                {PRO_TIERS.map((tier, index) => {
                  const isCurrentTier = tier.slug === currentPlanSlug;
                  return (
                    <button
                      key={tier.slug}
                      onClick={() => setSelectedProTier(index)}
                      className={`py-1.5 rounded text-xs font-semibold transition-all relative ${
                        selectedProTier === index
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : isCurrentTier
                            ? 'bg-emerald-600/30 text-emerald-400 ring-1 ring-emerald-500'
                            : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tier.visitors.replace(',000', 'k')}
                      {isCurrentTier && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400" /> 3 Websites
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400" /> All widget styles
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400" /> Remove branding
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-400" /> Priority support
              </li>
            </ul>

            <button 
              onClick={() => !proButtonState.disabled && createCheckout(PRO_TIERS[selectedProTier].slug)}
              disabled={checkoutLoading || proButtonState.disabled}
              className={`w-full py-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed ${
                proButtonState.style === 'current'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                  : proButtonState.style === 'downgrade'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {checkoutLoading ? 'Processing...' : proButtonState.text}
            </button>
          </div>

          {/* Growth Plan */}
          <div className={`rounded-xl border-2 p-6 relative ${isOnGrowthPlan ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20' : 'border-gray-200'}`}>
            {isOnGrowthPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ✓ YOUR PLAN
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 mb-1">Growth</h3>
            <p className="text-gray-500 text-sm mb-4">For high-traffic sites</p>

            <div className="mb-3">
              <span className="text-3xl font-bold text-gray-900">${GROWTH_TIERS[selectedGrowthTier].price}</span>
              <span className="text-gray-500">/month</span>
            </div>

            {/* Tier selector */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                <span>Monthly visitors</span>
                <span className="text-violet-600 font-semibold">{GROWTH_TIERS[selectedGrowthTier].visitors}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 p-1 bg-gray-100 rounded-lg">
                {GROWTH_TIERS.map((tier, index) => {
                  const isCurrentTier = tier.slug === currentPlanSlug;
                  return (
                    <button
                      key={tier.slug}
                      onClick={() => setSelectedGrowthTier(index)}
                      className={`py-1.5 rounded text-xs font-semibold transition-all relative ${
                        selectedGrowthTier === index
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                          : isCurrentTier
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500'
                            : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tier.visitors.replace(',000', 'k').replace('1,000k', '1M')}
                      {isCurrentTier && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> Unlimited Websites
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> All widget styles
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> Dedicated support
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" /> SLA guarantee
              </li>
            </ul>

            <button 
              onClick={() => !growthButtonState.disabled && createCheckout(GROWTH_TIERS[selectedGrowthTier].slug)}
              disabled={checkoutLoading || growthButtonState.disabled}
              className={`w-full py-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed ${
                growthButtonState.style === 'current'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-500/50'
                  : growthButtonState.style === 'downgrade'
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
              }`}
            >
              {checkoutLoading ? 'Processing...' : growthButtonState.text}
            </button>
          </div>
        </div>
      </div>


      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payment.metadata?.plan_name || 'Subscription'}</p>
                    <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${payment.amount_usd}</p>
                  <p className={`text-sm ${payment.status === 'completed' ? 'text-green-600' :
                    payment.status === 'failed' ? 'text-red-600' :
                      payment.status === 'refunded' ? 'text-orange-600' :
                        'text-gray-500'
                    }`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Need help with billing?</h3>
          <p className="text-gray-600 text-sm">Contact our support team for any billing questions.</p>
        </div>
        <button
          onClick={() => onNavigate?.('support')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <LifeBuoy className="w-4 h-4" />
          Contact Support
        </button>
      </div>

      {/* Toast notifications */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
