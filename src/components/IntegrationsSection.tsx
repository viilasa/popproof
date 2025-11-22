import { useState } from 'react';
import { IntegrationCard, Integration } from './IntegrationCard';
import { Puzzle, ShoppingBag, Code, Star } from 'lucide-react';

interface IntegrationsSectionProps {
  siteId: string;
  onPlatformSelect?: (platformId: string) => void;
}

export function IntegrationsSection({ siteId, onPlatformSelect }: IntegrationsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ecommerce' | 'cms' | 'developer' | 'review'>('all');

  // Integration definitions
  const integrations: Integration[] = [
    // E-commerce Integrations
    {
      id: 'shopify',
      name: 'Shopify',
      description: '',
      icon: 'https://cdn.freebiesupply.com/logos/large/2x/shopify-logo-png-transparent.png',
      category: 'ecommerce',
      status: 'not_connected',
      setupComplexity: 'easy'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: '',
      icon: 'https://download.logo.wine/logo/WooCommerce/WooCommerce-Logo.wine.png',
      category: 'ecommerce',
      status: 'not_connected',
      setupComplexity: 'easy'
    },
    {
      id: 'medusa',
      name: 'Medusa',
      description: '',
      icon: 'https://user-images.githubusercontent.com/7554214/153162406-bf8fd16f-aa98-4604-b87b-e13ab4baf604.png',
      category: 'ecommerce',
      status: 'not_connected',
      setupComplexity: 'medium',
      comingSoon: true
    },

    // CMS Integrations
    {
      id: 'wordpress',
      name: 'WordPress',
      description: '',
      icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiQqvP9mSAN_KNxZlbvD9VT-yl4Vf_PuT6Cw&s',
      category: 'cms',
      status: 'not_connected',
      setupComplexity: 'easy'
    },
    {
      id: 'html',
      name: 'HTML',
      description: '',
      icon: '📄',
      category: 'cms',
      status: 'not_connected',
      setupComplexity: 'easy'
    },

    // Developer Tools
    {
      id: 'webhook',
      name: 'Webhook',
      description: '',
      icon: '🔗',
      category: 'developer',
      status: 'not_connected',
      setupComplexity: 'easy'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: '',
      icon: 'https://1000logos.net/wp-content/uploads/2022/09/Zapier-Emblem.png',
      category: 'developer',
      status: 'not_connected',
      setupComplexity: 'medium',
      comingSoon: true
    },

    // Review Platforms
    {
      id: 'google-reviews',
      name: 'Google Reviews',
      description: '',
      icon: 'https://w7.pngwing.com/pngs/89/167/png-transparent-google-customer-review-business-company-google-search-engine-optimization-company-text-thumbnail.png',
      category: 'review',
      status: 'not_connected',
      setupComplexity: 'medium',
      comingSoon: true
    }
  ];

  const categories = [
    { id: 'all', label: 'All Integrations', icon: Puzzle },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
    { id: 'cms', label: 'CMS', icon: Code },
    { id: 'developer', label: 'Developer', icon: Code },
    { id: 'review', label: 'Reviews', icon: Star }
  ];

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory);

  const handleConnect = (integrationId: string) => {
    console.log('Connect integration:', integrationId);
    // If onPlatformSelect is provided, use it (new flow)
    if (onPlatformSelect) {
      onPlatformSelect(integrationId);
    } else {
      // Fallback to old flow
      alert(`Connecting ${integrationId}... (Coming soon!)`);
    }
  };

  const handleSettings = (integrationId: string) => {
    console.log('Open settings for:', integrationId);
    // TODO: Implement settings modal
  };

  const handleDisconnect = (integrationId: string) => {
    console.log('Disconnect integration:', integrationId);
    // TODO: Implement disconnect flow
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-4 sm:px-6 py-5 sm:py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Puzzle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Platform Integrations</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Connect your e-commerce, CMS, and other platforms to automate social proof</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{category.label}</span>
                  <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {category.id === 'all' 
                      ? integrations.length 
                      : integrations.filter(i => i.category === category.id).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="p-4 sm:p-6">
        {filteredIntegrations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={handleConnect}
                onSettings={handleSettings}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Puzzle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">No integrations found in this category</p>
          </div>
        )}
      </div>

      {/* Footer Help Text */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-lg sm:text-xl">💡</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base text-gray-900 font-semibold">Need a custom integration?</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Use our <span className="font-semibold text-blue-600">Webhook</span> integration to connect any platform, 
              or contact support for help setting up a custom integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
