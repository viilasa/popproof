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
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      {/* Logo - Large and centered */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 overflow-hidden">
          {integration.icon.startsWith('http') ? (
            <img 
              src={integration.icon} 
              alt={integration.name}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <span className="text-5xl">{integration.icon}</span>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="text-center mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">
          {integration.name}
        </h3>
      </div>

      {/* Status Badge - centered */}
      <div className="flex justify-center mb-4">
        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {integration.comingSoon ? (
          <button
            disabled
            className="flex-1 bg-gray-100 text-gray-400 px-4 py-2.5 rounded-lg cursor-not-allowed text-sm font-medium"
          >
            Coming Soon
          </button>
        ) : integration.status === 'not_connected' ? (
          <button
            onClick={() => onConnect(integration.id)}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              onClick={() => onSettings?.(integration.id)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => onDisconnect?.(integration.id)}
              className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
