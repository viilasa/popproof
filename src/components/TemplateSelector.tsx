import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notificationTemplates } from '../lib/notificationTemplates';

interface TemplateSelectorProps {
  onTemplateSelected?: (widgetId: string) => void;
  onBack?: () => void;
  userId?: string;
  selectedSiteId?: string;
}

export function TemplateSelector({ 
  onTemplateSelected, 
  onBack,
  userId,
  selectedSiteId 
}: TemplateSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = async (templateId: string) => {
    if (!selectedSiteId || !userId) {
      setError('Please select a site first');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const template = notificationTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create widget with complete config including eventTypes from template
      const { data: widget, error: widgetError } = await supabase
        .from('widgets')
        .insert([{
          user_id: userId,
          site_id: selectedSiteId,
          name: template.name,
          type: 'notification',
          is_active: true,
          notification_time_range: template.defaultRules?.timeWindowHours || 168,
          config: {
            template_id: template.id,
            template_name: template.name,
            preview: template.preview,
            triggers: {
              events: {
                eventTypes: template.defaultRules?.eventTypes || []
              }
            },
            rules: {
              eventTypes: template.defaultRules?.eventTypes || [],
              timeWindowHours: template.defaultRules?.timeWindowHours || 168,
              excludeTestEvents: template.defaultRules?.excludeTestEvents ?? true,
              minValue: template.defaultRules?.minValue || 0
            }
          }
        }])
        .select()
        .single();

      if (widgetError) throw widgetError;

      if (widget && onTemplateSelected) {
        onTemplateSelected(widget.id);
      }
    } catch (err: any) {
      console.error('Error creating widget:', err);
      setError(err.message || 'Failed to create widget');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Create New Widget</h1>
            <p className="text-sm text-gray-500 mt-0.5">Choose a template to get started</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notificationTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                disabled={isCreating}
                className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors">
                    <span className="text-3xl">{getTemplateIcon(template.icon)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 text-lg">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {template.category.replace('_', ' ')}
                  </span>
                </div>

                {/* Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Preview:</div>
                  <div className="flex items-start space-x-2">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold text-blue-600">{template.preview.title}</span>
                        <span className="text-gray-700 ml-1">{template.preview.message}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{template.preview.timestamp}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-3 text-gray-900 font-medium">Creating widget...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get template icon emoji
function getTemplateIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    'shopping-bag': '🛍️',
    'user-plus': '👤',
    'star': '⭐',
    'users': '👥',
    'file-text': '📄',
    'shopping-cart': '🛒',
    'activity': '📊',
    'bell': '🔔',
    'grid': '📋',
  };
  return iconMap[icon] || '📌';
}
