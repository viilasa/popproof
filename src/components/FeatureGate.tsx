import { ReactNode } from 'react';
import { Lock, Crown, Zap } from 'lucide-react';
import { useSubscription, FEATURES } from '../contexts/SubscriptionContext';

type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

interface FeatureGateProps {
    feature: FeatureKey;
    children: ReactNode;
    fallback?: ReactNode;
    showLockOverlay?: boolean;
    className?: string;
}

/**
 * FeatureGate - Wraps content and shows upgrade prompt if feature is locked
 * 
 * Usage:
 * <FeatureGate feature={FEATURES.REMOVE_BRANDING}>
 *   <SomeProFeatureComponent />
 * </FeatureGate>
 */
export function FeatureGate({
    feature,
    children,
    fallback,
    showLockOverlay = true,
    className = ''
}: FeatureGateProps) {
    const { canAccessFeature, isTrialing, trialDaysLeft, isTrialExpired } = useSubscription();
    const access = canAccessFeature(feature);

    if (access.allowed) {
        return <>{children}</>;
    }

    // Custom fallback provided
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default locked state with overlay
    if (showLockOverlay) {
        return (
            <div className={`relative ${className}`}>
                {/* Blurred/dimmed content */}
                <div className="opacity-50 pointer-events-none filter blur-[1px]">
                    {children}
                </div>

                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-[2px] rounded-lg">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">
                            {isTrialExpired ? 'Trial Expired' : 'Feature Locked'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {access.reason}
                        </p>
                        {isTrialing && !isTrialExpired && (
                            <p className="text-xs text-amber-600 mb-4">
                                <Zap className="w-3 h-3 inline mr-1" />
                                {trialDaysLeft} days left in trial
                            </p>
                        )}
                        <a
                            href="/billing"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            <Crown className="w-4 h-4" />
                            Upgrade Now
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // No overlay, just don't render
    return null;
}

/**
 * LockedBadge - Small badge to show locked status
 */
export function LockedBadge({ feature }: { feature: FeatureKey }) {
    const { hasFeature } = useSubscription();

    if (hasFeature(feature)) return null;

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
            <Lock className="w-3 h-3" />
            Pro
        </span>
    );
}

/**
 * UpgradePrompt - CTA to upgrade
 */
export function UpgradePrompt({
    message = "Upgrade to unlock all features",
    compact = false
}: {
    message?: string;
    compact?: boolean;
}) {
    const { isTrialing, trialDaysLeft, isTrialExpired } = useSubscription();

    if (compact) {
        return (
            <a
                href="/billing"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
                <Crown className="w-4 h-4" />
                Upgrade
            </a>
        );
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{message}</p>
                    {isTrialing && !isTrialExpired && (
                        <p className="text-sm text-amber-600">
                            Trial ends in {trialDaysLeft} days
                        </p>
                    )}
                    {isTrialExpired && (
                        <p className="text-sm text-red-600">
                            Your trial has expired
                        </p>
                    )}
                </div>
                <a
                    href="/billing"
                    className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    Upgrade
                </a>
            </div>
        </div>
    );
}

/**
 * TrialBanner - Shows trial status at top of page
 */
export function TrialBanner() {
    const { isTrialing, trialDaysLeft, isTrialExpired, isPaidPlan } = useSubscription();

    // Don't show for paid users
    if (isPaidPlan) return null;

    // Trial expired
    if (isTrialExpired) {
        return (
            <div className="bg-red-600 text-white py-2 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <p className="text-sm">
                        <span className="font-semibold">Trial expired!</span> Upgrade now to continue using premium features.
                    </p>
                    <a
                        href="/billing"
                        className="px-3 py-1 bg-white text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
                    >
                        Upgrade Now
                    </a>
                </div>
            </div>
        );
    }

    // Active trial
    if (isTrialing) {
        const urgency = trialDaysLeft <= 3 ? 'bg-amber-500' : 'bg-blue-600';
        return (
            <div className={`${urgency} text-white py-2 px-4`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <p className="text-sm">
                        <Zap className="w-4 h-4 inline mr-1" />
                        <span className="font-semibold">{trialDaysLeft} days left</span> in your free trial.
                        {trialDaysLeft <= 3 && " Don't lose access to premium features!"}
                    </p>
                    <a
                        href="/billing"
                        className="px-3 py-1 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                        Upgrade Now
                    </a>
                </div>
            </div>
        );
    }

    return null;
}

export { FEATURES };
