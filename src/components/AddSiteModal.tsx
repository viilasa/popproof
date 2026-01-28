import React, { useState, useEffect } from 'react';
import { X, Globe, Lock, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../contexts/SubscriptionContext';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteAdded: () => void;
  onPixelIntegrationRedirect: (site: any) => void;
  userId: string;
}

export function AddSiteModal({ isOpen, onClose, onSiteAdded, onPixelIntegrationRedirect, userId }: AddSiteModalProps) {
  const { subscription, isTrialing, isPaidPlan, currentTier } = useSubscription();
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    includeSubdomains: false,
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentSiteCount, setCurrentSiteCount] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  const categories = [
    'E-commerce',
    'SaaS',
    'Blog',
    'Portfolio',
    'Business',
    'Education',
    'Healthcare',
    'Real Estate',
    'Other'
  ];

  // Get site limit based on subscription
  const getSiteLimit = () => {
    if (!subscription?.plan) return 1; // Default to 1 for trial/no subscription

    const tier = subscription.plan.tier;
    const websiteLimit = subscription.plan.website_limit;

    // -1 means unlimited
    if (websiteLimit === -1) return Infinity;

    // Use the plan's website limit
    return websiteLimit || 1;
  };

  // Check current site count
  useEffect(() => {
    const checkSiteCount = async () => {
      if (!userId || !isOpen) return;

      setCheckingLimit(true);
      try {
        const { count, error } = await supabase
          .from('sites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (!error && count !== null) {
          setCurrentSiteCount(count);
          const limit = getSiteLimit();
          setLimitReached(count >= limit);
        }
      } catch (err) {
        console.error('Error checking site count:', err);
      } finally {
        setCheckingLimit(false);
      }
    };

    checkSiteCount();
  }, [userId, isOpen, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check site limit before creating
    const limit = getSiteLimit();
    if (currentSiteCount >= limit) {
      setError(`You've reached your site limit (${limit} ${limit === 1 ? 'site' : 'sites'}). Upgrade your plan to add more websites.`);
      return;
    }

    if (!formData.name.trim() || !formData.domain.trim()) {
      setError('Name and domain are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate public key for the new site
      const publicKey = 'sp_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create site record
      const { data: newSite, error: insertError } = await supabase
        .from('sites')
        .insert({
          user_id: userId,
          name: formData.name,
          domain: formData.domain,
          public_key: publicKey,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        // Show more specific error messages
        if (insertError.code === '42501') {
          throw new Error('Permission denied. Please try logging out and back in.');
        } else if (insertError.code === '23505') {
          throw new Error('A site with this domain already exists.');
        } else if (insertError.code === '23503') {
          throw new Error('Invalid user reference. Please try logging out and back in.');
        } else if (insertError.message) {
          throw new Error(insertError.message);
        } else {
          throw insertError;
        }
      }

      if (!newSite) {
        throw new Error('Failed to create site and retrieve its data.');
      }

      // Reset form
      setFormData({
        name: '',
        domain: '',
        includeSubdomains: false,
        category: ''
      });

      // Show success message and redirect to pixel integration
      setSuccess('Site created successfully! Redirecting to pixel integration...');

      // Wait 2 seconds then redirect to pixel integration
      setTimeout(() => {
        onSiteAdded();
        onClose();
        // Trigger redirect to pixel integration with the new site data
        onPixelIntegrationRedirect(newSite);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating site:', error);
      // Check if it's a RLS policy error or other specific error
      if (error?.message?.includes('policy')) {
        setError('Permission denied. Please try logging out and back in.');
      } else {
        setError('Failed to create site. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    onClose();
    // Navigate to billing - trigger a custom event or use window location
    window.location.hash = '#billing';
    // Or dispatch event for Dashboard to handle
    window.dispatchEvent(new CustomEvent('navigate-to-billing'));
  };

  if (!isOpen) return null;

  const siteLimit = getSiteLimit();
  const siteLimitText = siteLimit === Infinity ? 'Unlimited' : siteLimit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create a new site</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Site Limit Info Banner */}
        {!checkingLimit && (
          <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${limitReached
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-blue-50 border border-blue-100'
            }`}>
            <div className="flex items-center gap-2">
              {limitReached ? (
                <Lock className="w-4 h-4 text-amber-500" />
              ) : (
                <Globe className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm text-gray-700">
                Sites: <strong>{currentSiteCount}</strong> / <strong>{siteLimitText}</strong>
                {isTrialing && <span className="text-amber-600 ml-1">(Trial)</span>}
              </span>
            </div>
            {(limitReached || (isTrialing && currentSiteCount >= 1)) && (
              <button
                onClick={handleUpgradeClick}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Crown className="w-3 h-3" />
                Upgrade
              </button>
            )}
          </div>
        )}

        {/* Limit Reached Message */}
        {limitReached && (
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Site Limit Reached</p>
                <p className="text-sm text-gray-600 mt-1">
                  {isTrialing
                    ? "Your trial plan allows 1 website. Upgrade to Pro to add more sites."
                    : `Your ${currentTier} plan allows ${siteLimit} ${siteLimit === 1 ? 'website' : 'websites'}. Upgrade to add more.`
                  }
                </p>
                <button
                  onClick={handleUpgradeClick}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form - Disabled if limit reached */}
        <form onSubmit={handleSubmit} className={`space-y-4 ${limitReached ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <span className="text-blue-500 mr-2">▶</span>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My Website"
              required
              disabled={limitReached}
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2 text-gray-500" />
              Domain / Subdomain
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex: domain.com or subdomain.domain.com"
              required
              disabled={limitReached}
            />
            <p className="text-xs text-gray-500 mt-1">
              The domain name of the website where the site is going to run.
              Notifications will NOT work on other domains other than what you
              define here.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeSubdomains"
              checked={formData.includeSubdomains}
              onChange={(e) => setFormData(prev => ({ ...prev, includeSubdomains: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={limitReached}
            />
            <label htmlFor="includeSubdomains" className="text-sm text-gray-700">
              <span className="font-medium">Include Subdomains</span> If you use a platform like
              ClickFunnels, SamCart, etc. you have to open the 'Include
              Subdomains' feature. All the subdomains will match on this
              site as well if checked.
            </label>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2 text-gray-500" />
              Site Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={limitReached}
            >
              <option value="">Choose Site Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {error && !limitReached && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success !== '' || limitReached}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : success ? 'Redirecting...' : limitReached ? 'Upgrade to Add More Sites' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
}