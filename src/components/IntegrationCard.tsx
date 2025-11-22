import { CheckCircle, Settings, AlertCircle } from 'lucide-react';

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ecommerce' | 'cms' | 'developer' | 'review';
  status: 'not_connected' | 'connected' | 'active' | 'error';
  setupComplexity: 'easy' | 'medium' | 'advanced';
  popular?: boolean;
  comingSoon?: boolean;
  badge?: string;
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onSettings?: (id: string) => void;
  onDisconnect?: (id: string) => void;
}

export function IntegrationCard({ 
  integration, 
  onConnect, 
  onSettings, 
  onDisconnect 
}: IntegrationCardProps) {
  const getStatusColor = () => {
    switch (integration.status) {
      case 'active':
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (integration.status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (integration.status) {
      case 'active':
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Not Connected';
    }
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-5 border-b border-gray-200">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden mb-3">
            {integration.icon.startsWith('http') ? (
              <img 
                src={integration.icon} 
                alt={integration.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
            ) : (
              <span className="text-3xl sm:text-4xl">{integration.icon}</span>
            )}
          </div>
          
          {/* Name */}
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">
            {integration.name}
          </h3>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5">
        {/* Complexity Badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-xs text-gray-600">Setup:</span>
            <span className={`text-xs font-semibold capitalize ${
              integration.setupComplexity === 'easy' ? 'text-green-600' :
              integration.setupComplexity === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {integration.setupComplexity}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
        {integration.comingSoon ? (
          <button
            disabled
            className="flex-1 bg-gray-100 text-gray-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg cursor-not-allowed text-xs sm:text-sm font-medium min-h-[44px] sm:min-h-0"
          >
            Coming Soon
          </button>
        ) : integration.status === 'not_connected' ? (
          <button
            onClick={() => onConnect(integration.id)}
            className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-0"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              onClick={() => onSettings?.(integration.id)}
              className="flex-1 bg-gray-100 text-gray-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1.5 sm:space-x-2 touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => onDisconnect?.(integration.id)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] sm:min-h-0"
            >
              Disconnect
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
