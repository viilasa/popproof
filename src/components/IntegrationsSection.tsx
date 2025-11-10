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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Puzzle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Platform Integrations</h2>
            <p className="text-sm text-gray-600">Connect your favorite tools and platforms to automate social proof</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
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
      <div className="p-6">
        {filteredIntegrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-12">
            <Puzzle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No integrations found in this category</p>
          </div>
        )}
      </div>

      {/* Footer Help Text */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-blue-600 text-xs font-bold">💡</span>
          </div>
          <div>
            <p className="text-sm text-gray-700 font-medium">Need a custom integration?</p>
            <p className="text-xs text-gray-600 mt-1">
              Use our <span className="font-medium text-blue-600">Webhook</span> integration to connect any platform, 
              or contact us for help setting up a custom integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
