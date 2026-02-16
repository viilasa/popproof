import React from 'react';
import { 
  Check, 
  X, 
  Loader2,
  Shield,
  Crown
} from 'lucide-react';
import { useRevenueCat, usePaywall, useCustomerCenter } from '../../hooks/useRevenueCat';
import type { Package } from '../../lib/revenuecat';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const { isLoading, offerings } = useRevenueCat();
  const { presentPaywall, isPresenting } = usePaywall();
  const currentOffering = offerings?.current;

  if (!isOpen) return null;

  const handleSubscribe = async (_pkg: Package) => {
    const result = await presentPaywall();
    
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl m-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-4">
            <Crown size={16} />
            <span>Upgrade to Pro</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Unlock ProofEdge Pro
          </h2>
          <p className="text-gray-600 text-lg max-w-lg mx-auto">
            Get unlimited visitors, premium notifications, priority support, and more.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 pb-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : currentOffering ? (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Monthly */}
              {currentOffering.monthly && (
                <PricingCard
                  pkg={currentOffering.monthly}
                  onSubscribe={() => handleSubscribe(currentOffering.monthly!)}
                  isLoading={isPresenting}
                  popular={false}
                />
              )}

              {/* Annual - Marked as popular */}
              {currentOffering.annual && (
                <PricingCard
                  pkg={currentOffering.annual}
                  onSubscribe={() => handleSubscribe(currentOffering.annual!)}
                  isLoading={isPresenting}
                  popular={true}
                />
              )}

              {/* Lifetime */}
              {currentOffering.lifetime && (
                <PricingCard
                  pkg={currentOffering.lifetime}
                  onSubscribe={() => handleSubscribe(currentOffering.lifetime!)}
                  isLoading={isPresenting}
                  popular={false}
                  lifetime
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Unable to load pricing. Please try again later.</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-gray-50 px-6 py-6 rounded-b-3xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            All plans include
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            <FeatureItem text="Unlimited visitors" />
            <FeatureItem text="Premium notification templates" />
            <FeatureItem text="Custom branding" />
            <FeatureItem text="Priority support" />
            <FeatureItem text="Advanced analytics" />
            <FeatureItem text="A/B testing" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

interface PricingCardProps {
  pkg: Package;
  onSubscribe: () => void;
  isLoading: boolean;
  popular?: boolean;
  lifetime?: boolean;
}

function PricingCard({ pkg, onSubscribe, isLoading, popular, lifetime }: PricingCardProps) {
  const product = pkg.product;
  const price = product.defaultSubscriptionOption?.price || {
    formattedPrice: product.priceString,
    currencyCode: product.currencyCode,
    amountMicros: 0,
  };

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 transition-all ${
        popular
          ? 'border-indigo-600 bg-indigo-50/50 scale-105 shadow-xl'
          : 'border-gray-200 hover:border-indigo-300'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">
          {lifetime ? 'Lifetime' : product.title}
        </h4>
        <p className="text-sm text-gray-500">
          {lifetime ? 'Pay once, use forever' : 'Recurring subscription'}
        </p>
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-gray-900">
          {price.formattedPrice}
        </span>
        {!lifetime && (
          <span className="text-gray-500 text-sm">/month</span>
        )}
      </div>

      <button
        onClick={onSubscribe}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
          popular
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </span>
        ) : (
          'Subscribe Now'
        )}
      </button>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
        <Check size={12} className="text-emerald-600" />
      </div>
      <span className="text-gray-700 text-sm">{text}</span>
    </div>
  );
}

// ==================== Pro Badge Component ====================

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
      <Crown size={12} />
      PRO
    </span>
  );
}

// ==================== Subscription Status Component ====================

export function SubscriptionStatus() {
  const { isLoading, isPro } = useRevenueCat();
  const { openCustomerCenter } = useCustomerCenter();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Loading subscription...</span>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="flex items-center gap-3">
        <ProBadge />
        <button
          onClick={openCustomerCenter}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Manage Subscription
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-500">
      <Shield size={16} />
      <span className="text-sm">Free Plan</span>
    </div>
  );
}
