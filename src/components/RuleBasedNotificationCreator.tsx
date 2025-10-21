import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  notificationTemplates, 
  notificationCategories,
  getTemplateById,
  formatNotificationMessage,
  type NotificationTemplate 
} from '../lib/notificationTemplates';
import {
  ShoppingBag,
  UserPlus,
  Star,
  Users,
  FileText,
  ShoppingCart,
  Activity,
  Bell,
  X,
  Check,
  ArrowLeft,
  Settings,
  Loader2
} from 'lucide-react';

interface RuleBasedNotificationCreatorProps {
  onNotificationCreated?: (widgetId?: string) => void;
  userId?: string;
  selectedSiteId?: string;
  onBack?: () => void;
}

const iconMap: Record<string, any> = {
  'shopping-bag': ShoppingBag,
  'user-plus': UserPlus,
  'star': Star,
  'users': Users,
  'file-text': FileText,
  'shopping-cart': ShoppingCart,
  'activity': Activity,
  'bell': Bell,
  'grid': Activity
};

export function RuleBasedNotificationCreator({ 
  onNotificationCreated, 
  userId, 
  selectedSiteId,
  onBack 
}: RuleBasedNotificationCreatorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showRuleConfig, setShowRuleConfig] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rule configuration state
  const [ruleName, setRuleName] = useState('');
  const [ruleConfig, setRuleConfig] = useState({
    eventTypes: [] as string[],
    minValue: 0,
    timeWindowHours: 24,
    excludeTestEvents: true,
    requireLocation: false,
    displayDuration: 8,
    showTimestamp: true,
    showLocation: true,
    anonymizeNames: false
  });

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all' 
    ? notificationTemplates 
    : notificationTemplates.filter(t => t.category === selectedCategory);

  // Handle template selection
  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setRuleName(`${template.name} Widget`);
    
    // Initialize with template defaults
    setRuleConfig({
      eventTypes: template.defaultRules.eventTypes,
      minValue: template.defaultRules.minValue || 0,
      timeWindowHours: template.defaultRules.timeWindowHours || 24,
      excludeTestEvents: template.defaultRules.excludeTestEvents ?? true,
      requireLocation: template.defaultRules.requireLocation ?? false,
      displayDuration: template.displayConfig.displayDuration,
      showTimestamp: template.displayConfig.showTimestamp,
      showLocation: template.displayConfig.showLocation,
      anonymizeNames: template.displayConfig.anonymizeNames ?? false
    });
    
    setShowRuleConfig(true);
  };

  // Create widget with rules
  const handleCreateWidget = async () => {
    if (!selectedTemplate || !userId || !selectedSiteId) {
      setError('Missing required information');
      return;
    }

    if (!ruleName.trim()) {
      setError('Please enter a widget name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // First verify the site exists and belongs to the user
      console.log('Verifying site:', selectedSiteId);
      console.log('Current user from prop:', userId);
      
      // Try to fetch site without .single() to avoid 406 error
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('id, user_id, name, domain')
        .eq('id', selectedSiteId);

      if (siteError) {
        console.error('Site verification error details:', {
          message: siteError.message,
          code: siteError.code,
          details: siteError.details,
          hint: siteError.hint,
          selectedSiteId
        });
        throw new Error(`Site verification failed: ${siteError.message || 'Unknown error'}`);
      }
      
      const site = siteData && siteData.length > 0 ? siteData[0] : null;
      
      if (!site) {
        console.error('No site data returned - RLS may be blocking or site does not exist');
        console.error('This might mean the site has no user_id or belongs to a different user');
        // Continue anyway - we'll use the selectedSiteId and userId from props
        console.warn('Proceeding with widget creation using provided site_id and user_id');
      }

      console.log('Site verified:', site);
      console.log('Site user_id:', site?.user_id);
      console.log('Current userId prop:', userId);
      
      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user?.id);
      
      // If site exists and doesn't have user_id, update it
      if (site && !site.user_id && user?.id) {
        console.log('Site missing user_id, updating...');
        const { error: updateError } = await supabase
          .from('sites')
          .update({ user_id: user.id })
          .eq('id', selectedSiteId);
        
        if (updateError) {
          console.error('Failed to update site user_id:', updateError);
        } else {
          console.log('Site user_id updated successfully');
        }
      } else if (site && site.user_id && site.user_id !== user?.id) {
        throw new Error(`Site belongs to user ${site.user_id} but you are ${user?.id}`);
      }

      // Create widget with both site_id and user_id
      const { data: widget, error: widgetError} = await supabase
        .from('widgets')
        .insert([{
          user_id: user?.id || userId,
          site_id: selectedSiteId,
          name: ruleName,
          type: 'notification',
          is_active: true,
          config: {
            template_id: selectedTemplate.id,
            template_name: selectedTemplate.name,
            
            // Rule configuration
            rules: {
              eventTypes: ruleConfig.eventTypes,
              minValue: ruleConfig.minValue,
              timeWindowHours: ruleConfig.timeWindowHours,
              excludeTestEvents: ruleConfig.excludeTestEvents,
              requireLocation: ruleConfig.requireLocation
            },
            
            // Display configuration
            display: {
              duration: ruleConfig.displayDuration,
              showTimestamp: ruleConfig.showTimestamp,
              showLocation: ruleConfig.showLocation,
              anonymizeNames: ruleConfig.anonymizeNames
            },
            
            // Message template
            messageTemplate: selectedTemplate.messageTemplate,
            
            // Preview (for dashboard display)
            preview: selectedTemplate.preview,
            
            // Widget settings
            position: 'bottom-left',
            theme: 'light',
            showBranding: true
          }
        }])
        .select()
        .single();

      if (widgetError) {
        console.error('Widget creation error details:', widgetError);
        console.error('Error as JSON:', JSON.stringify(widgetError, null, 2));
        console.error('Attempted insert:', { 
          user_id: user?.id || userId, 
          site_id: selectedSiteId, 
          type: 'notification', 
          is_active: true 
        });
        throw widgetError;
      }

      console.log('Widget created successfully:', widget);

      // Create notification rule
      const { error: ruleError } = await supabase
        .from('notification_rules')
        .insert([{
          site_id: selectedSiteId,
          widget_id: widget.id,
          name: ruleName,
          description: selectedTemplate.description,
          event_types: ruleConfig.eventTypes,
          min_value: ruleConfig.minValue > 0 ? ruleConfig.minValue : null,
          time_window_hours: ruleConfig.timeWindowHours,
          exclude_test_events: ruleConfig.excludeTestEvents,
          require_location: ruleConfig.requireLocation,
          display_delay_seconds: 0,
          display_duration_seconds: ruleConfig.displayDuration,
          max_displays_per_session: 5,
          template_id: selectedTemplate.id,
          custom_template: selectedTemplate.messageTemplate,
          is_active: true,
          priority: 0
        }]);

      if (ruleError) {
        console.error('Rule creation error:', ruleError);
        // Don't fail if rule creation fails, widget is already created
      }

      console.log('Widget created successfully:', widget.id);
      
      if (onNotificationCreated) {
        onNotificationCreated(widget.id);
      }
    } catch (err: any) {
      console.error('Error creating widget:', err);
      
      // Show detailed error message
      let errorMessage = 'Failed to create widget';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.code) {
        errorMessage = `Error ${err.code}: ${err.details || err.hint || 'Unknown error'}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Get icon component
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Bell;
  };

  // Template selection view
  if (!showRuleConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create Notification Widget</h1>
                  <p className="text-sm text-gray-600 mt-1">Choose a template to get started</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {notificationCategories.map((category) => {
                const Icon = getIcon(category.icon);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const Icon = getIcon(template.icon);
              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 p-6 cursor-pointer transition-all hover:shadow-lg group"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 capitalize">{template.category}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{template.preview.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{template.preview.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{template.preview.timestamp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Select Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Rule configuration view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowRuleConfig(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configure {selectedTemplate?.name}</h1>
                <p className="text-sm text-gray-600 mt-1">Set up rules and display settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Widget Name */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Name</h3>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Enter widget name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Rule Configuration */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Trigger Rules</span>
              </h3>

              <div className="space-y-4">
                {/* Event Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Types
                  </label>
                  <div className="text-sm text-gray-600 mb-2">
                    Tracking: {ruleConfig.eventTypes.join(', ')}
                  </div>
                </div>

                {/* Minimum Value */}
                {selectedTemplate?.id === 'recent_purchase' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase Value ($)
                    </label>
                    <input
                      type="number"
                      value={ruleConfig.minValue}
                      onChange={(e) => setRuleConfig({ ...ruleConfig, minValue: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Only show purchases above this amount</p>
                  </div>
                )}

                {/* Time Window */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Window (hours)
                  </label>
                  <select
                    value={ruleConfig.timeWindowHours}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, timeWindowHours: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Last 1 hour</option>
                    <option value={24}>Last 24 hours</option>
                    <option value={48}>Last 2 days</option>
                    <option value={168}>Last 7 days</option>
                    <option value={720}>Last 30 days</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Show events from this time period</p>
                </div>

                {/* Exclude Test Events */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="excludeTest"
                    checked={ruleConfig.excludeTestEvents}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, excludeTestEvents: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="excludeTest" className="ml-2 text-sm text-gray-700">
                    Exclude test events
                  </label>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h3>

              <div className="space-y-4">
                {/* Display Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={ruleConfig.displayDuration}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, displayDuration: Number(e.target.value) })}
                    min="3"
                    max="30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Show Timestamp */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showTimestamp"
                    checked={ruleConfig.showTimestamp}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, showTimestamp: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showTimestamp" className="ml-2 text-sm text-gray-700">
                    Show timestamp (e.g., "2 minutes ago")
                  </label>
                </div>

                {/* Show Location */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showLocation"
                    checked={ruleConfig.showLocation}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, showLocation: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showLocation" className="ml-2 text-sm text-gray-700">
                    Show location (e.g., "from New York")
                  </label>
                </div>

                {/* Anonymize Names */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymize"
                    checked={ruleConfig.anonymizeNames}
                    onChange={(e) => setRuleConfig({ ...ruleConfig, anonymizeNames: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymize" className="ml-2 text-sm text-gray-700">
                    Anonymize names (e.g., "John D." instead of "John Doe")
                  </label>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateWidget}
              disabled={isCreating || !ruleName.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Widget...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Create Widget</span>
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              
              {selectedTemplate && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    {(() => {
                      const Icon = getIcon(selectedTemplate.icon);
                      return (
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedTemplate.preview.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedTemplate.preview.message}
                      </p>
                      {ruleConfig.showTimestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {selectedTemplate.preview.timestamp}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                <p><strong>Note:</strong> Actual notifications will display real data from your site events.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RuleBasedNotificationCreator;
