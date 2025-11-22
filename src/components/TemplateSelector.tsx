import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { notificationTemplates } from '../lib/notificationTemplates';
import {
  notificationDesignPresets,
  type NotificationDesignPreset,
  type NotificationTemplateId,
} from '../lib/notificationDesignPresets';
import type { DesignSettings, DisplaySettings } from '../types/widget-config';
import { DEFAULT_DESIGN_SETTINGS, DEFAULT_DISPLAY_SETTINGS } from '../lib/widgetConfigDefaults';

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

  const [mode, setMode] = useState<'template' | 'design'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationTemplateId>('all');

  const templatesById = Object.fromEntries(notificationTemplates.map((t) => [t.id, t]));

  const currentTemplateId: NotificationTemplateId | null =
    (activeFilter === 'all'
      ? (selectedTemplateId as NotificationTemplateId | null)
      : activeFilter) || null;

  const filteredPresets = notificationDesignPresets.filter((preset) =>
    activeFilter === 'all' ? true : preset.templateId === activeFilter
  );

  const templateTabs: { id: 'all' | NotificationTemplateId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'recent_purchase', label: 'Recent Purchase' },
    { id: 'new_signup', label: 'New Signup' },
    { id: 'customer_review', label: 'Customer Reviews' },
    { id: 'live_visitors', label: 'Live Visitor' },
    { id: 'form_submission', label: 'Form Submission' },
    { id: 'cart_activity', label: 'Cart Activity' },
    { id: 'active_sessions', label: 'Active Sessions' },
    { id: 'recent_activity', label: 'Recent Activity' },
  ];

  const createWidgetWithPreset = async (preset: NotificationDesignPreset) => {
    if (!selectedSiteId) {
      setError('Please select a site first');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const template = notificationTemplates.find((t) => t.id === preset.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error while creating widget:', authError);
        throw new Error('You must be signed in to create widgets');
      }

      const currentUserId = authData.user?.id || userId;
      if (!currentUserId) {
        throw new Error('Missing user information while creating widget');
      }

      // Verify the site belongs to the current user or claim it if user_id is null
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('id, user_id')
        .eq('id', selectedSiteId);

      if (siteError) {
        console.error('Site verification error when creating widget:', siteError);
        throw new Error(siteError.message || 'Failed to verify site for widget');
      }

      const site = siteData && siteData.length > 0 ? siteData[0] : null;

      if (!site) {
        throw new Error('Site not found. Please re-select your site and try again.');
      }

      // If site has a different owner, block creation
      if (site.user_id && site.user_id !== currentUserId) {
        console.error('Site belongs to a different user', { siteUserId: site.user_id, currentUserId });
        throw new Error('This site belongs to a different user. Please switch account or site.');
      }

      // If site has no owner yet, claim it for the current user (helps satisfy RLS policies)
      if (!site.user_id) {
        const { error: updateError } = await supabase
          .from('sites')
          .update({ user_id: currentUserId })
          .eq('id', selectedSiteId);

        if (updateError) {
          console.error('Failed to set site user_id while creating widget:', updateError);
          // Don't hard-fail here; RLS might still allow insert if policies are lenient
        }
      }

      // Normalize time window for the column (must be an integer in hours)
      const rawTimeWindow = template.defaultRules?.timeWindowHours;
      const notificationTimeRange = Number.isFinite(rawTimeWindow as number)
        ? Math.max(1, Math.round(rawTimeWindow as number))
        : 168;

      const mergedDesign: DesignSettings = mergeDesignWithDefaults(preset.design || {});
      const mergedDisplay: DisplaySettings = mergeDisplayWithDefaults(preset.display || {});

      // Create widget with complete config including eventTypes from template
      const { data: widget, error: widgetError } = await supabase
        .from('widgets')
        .insert([{
          user_id: currentUserId,
          site_id: selectedSiteId,
          name: template.name,
          type: 'notification',
          is_active: true,
          notification_time_range: notificationTimeRange,
          position: mergedDesign.position.position,
          offset_x: mergedDesign.position.offsetX,
          offset_y: mergedDesign.position.offsetY,
          layout_style: mergedDesign.layout.layout,
          max_width: mergedDesign.layout.maxWidth,
          min_width: mergedDesign.layout.minWidth,
          border_radius: mergedDesign.border.borderRadius,
          border_width: mergedDesign.border.borderWidth,
          border_color: mergedDesign.border.borderColor,
          border_left_accent: mergedDesign.border.borderLeftAccent,
          border_left_accent_width: mergedDesign.border.borderLeftAccentWidth,
          border_left_accent_color: mergedDesign.border.borderLeftAccentColor,
          shadow_enabled: mergedDesign.shadow.shadowEnabled,
          shadow_size: mergedDesign.shadow.shadowSize,
          glassmorphism: mergedDesign.shadow.glassmorphism,
          backdrop_blur: mergedDesign.shadow.backdropBlur,
          background_color: mergedDesign.background.backgroundColor,
          background_gradient: mergedDesign.background.backgroundGradient,
          gradient_start: mergedDesign.background.gradientStart,
          gradient_end: mergedDesign.background.gradientEnd,
          gradient_direction: mergedDesign.background.gradientDirection,
          display_duration: mergedDisplay.duration.displayDuration,
          fade_in_duration: mergedDisplay.duration.fadeInDuration,
          fade_out_duration: mergedDisplay.duration.fadeOutDuration,
          animation_type: mergedDisplay.duration.animationType,
          progress_bar: mergedDisplay.duration.progressBar,
          progress_bar_color: mergedDisplay.duration.progressBarColor,
          progress_bar_position: mergedDisplay.duration.progressBarPosition,
          show_timestamp: mergedDisplay.content.showTimestamp,
          timestamp_format: mergedDisplay.content.timestampFormat,
          timestamp_prefix: mergedDisplay.content.timestampPrefix,
          show_location: mergedDisplay.content.showLocation,
          location_format: mergedDisplay.content.locationFormat,
          show_user_avatar: mergedDisplay.content.showUserAvatar,
          show_event_icon: mergedDisplay.content.showEventIcon,
          show_value: mergedDisplay.content.showValue,
          value_format: mergedDisplay.content.valueFormat,
          currency_code: mergedDisplay.content.currency,
          currency_position: mergedDisplay.content.currencyPosition,
          custom_time_range_hours: mergedDisplay.content.customTimeRangeHours || null,
          anonymize_names: mergedDisplay.privacy.anonymizeNames,
          anonymization_style: mergedDisplay.privacy.anonymizationStyle,
          hide_emails: mergedDisplay.privacy.hideEmails,
          hide_phone_numbers: mergedDisplay.privacy.hidePhoneNumbers,
          mask_ip_addresses: mergedDisplay.privacy.maskIpAddresses,
          gdpr_compliant: mergedDisplay.privacy.gdprCompliant,
          clickable: mergedDisplay.interaction.clickable,
          click_action: mergedDisplay.interaction.clickAction,
          click_url: mergedDisplay.interaction.clickUrl || null,
          click_url_target: mergedDisplay.interaction.clickUrlTarget,
          close_button: mergedDisplay.interaction.closeButton,
          close_button_position: mergedDisplay.interaction.closeButtonPosition,
          pause_on_hover: mergedDisplay.interaction.pauseOnHover,
          expand_on_hover: mergedDisplay.interaction.expandOnHover,
          mobile_position: mergedDisplay.responsive.mobilePosition || null,
          mobile_max_width: mergedDisplay.responsive.mobileMaxWidth || null,
          hide_on_mobile: mergedDisplay.responsive.hideOnMobile,
          hide_on_desktop: mergedDisplay.responsive.hideOnDesktop,
          stack_on_mobile: mergedDisplay.responsive.stackOnMobile,
          reduced_motion_support: mergedDisplay.responsive.reducedMotionSupport,
          config: {
            template_id: template.id,
            template_name: template.name,
            preview: template.preview,
            designPresetId: preset.id,
            design: mergedDesign,
            display: mergedDisplay,
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

      if (widgetError) {
        console.error('Widget creation error from Supabase:', widgetError);
        const detailedMessage =
          widgetError.message || widgetError.details || widgetError.hint || 'Failed to create widget';
        throw new Error(detailedMessage);
      }

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

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setActiveFilter(templateId as NotificationTemplateId);
    setMode('design');
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-4">
          {(onBack || mode === 'design') && (
            <button
              onClick={() => {
                if (mode === 'design') {
                  setMode('template');
                } else if (onBack) {
                  onBack();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {mode === 'template' ? 'Create New Widget' : 'Choose Design & Template'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === 'template'
                ? 'Choose a template to get started'
                : 'Pick a notification design that will be used on your live site'}
            </p>
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
          {mode === 'template' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notificationTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
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
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Choose a notification design</h2>
                  <p className="text-sm text-gray-500 mt-1">This design will be used on your live site.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {templateTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveFilter(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeFilter === tab.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPresets.length === 0 ? (
                  <div className="text-sm text-gray-500 col-span-full">
                    No designs available for this notification type yet.
                  </div>
                ) : (
                  filteredPresets.map((preset) => {
                    const template = templatesById[preset.templateId];

                    return (
                      <button
                        key={preset.id}
                        onClick={() => createWidgetWithPreset(preset)}
                        disabled={isCreating || !template}
                        className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                              {template ? template.name : 'Template'}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {preset.name}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {preset.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="text-[11px] font-medium text-gray-500 mb-1">Live preview</div>
                          <div className="flex items-start space-x-2">
                            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                              {template ? getTemplateIcon(template.icon) : '✓'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs">
                                <span className="font-semibold text-gray-900">
                                  {template ? template.preview.title : 'John D.'}
                                </span>
                                <span className="text-gray-700 ml-1">
                                  {template ? template.preview.message : 'purchased Premium Plan for $99'}
                                </span>
                              </p>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {template ? template.preview.timestamp : '2 minutes ago'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
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
