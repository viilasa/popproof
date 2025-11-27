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

function isObject(value: any): value is Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output: Record<string, any> = { ...target };

  if (!source) {
    return output as T;
  }

  Object.keys(source).forEach((key) => {
    const sourceValue = (source as any)[key];
    if (sourceValue === undefined) {
      return;
    }

    if (isObject(sourceValue) && isObject((target as any)[key])) {
      output[key] = deepMerge((target as any)[key], sourceValue);
    } else {
      output[key] = sourceValue;
    }
  });

  return output as T;
}

function mergeDesignWithDefaults(overrides: Partial<DesignSettings>): DesignSettings {
  return deepMerge(DEFAULT_DESIGN_SETTINGS, overrides || {});
}

function mergeDisplayWithDefaults(overrides: Partial<DisplaySettings>): DisplaySettings {
  return deepMerge(DEFAULT_DISPLAY_SETTINGS, overrides || {});
}

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
  const [mode, setMode] = useState<'template' | 'design'>('design');
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
                          
                          {/* Special Frosted Token Preview */}
                          {preset.design?.layout?.layout === 'frosted-token' ? (
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow text-white">
                                <div className="flex items-baseline gap-1 whitespace-nowrap">
                                  <span className="font-bold text-[10px]">32</span>
                                  <span className="text-[8px] font-medium opacity-80">purchased</span>
                                </div>
                              </div>
                              <div className="relative w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 shadow border border-white/20 shrink-0">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-50"></div>
                                <svg className="relative z-10 text-white" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                  <line x1="3" y1="6" x2="21" y2="6"></line>
                                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
                                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-red-500"></div>
                                </div>
                              </div>
                            </div>
                          ) : preset.design?.layout?.layout === 'story-pop' ? (
                            /* Special Story Pop Preview */
                            <div className="relative w-[80px] h-[110px] rounded-lg overflow-hidden shadow-lg border-2 border-white bg-white">
                              <button className="absolute top-1 right-1 z-30 w-3 h-3 bg-black/20 rounded-full flex items-center justify-center text-white">
                                <span className="text-[6px] font-bold">×</span>
                              </button>
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 z-0">
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                              <div className="absolute bottom-0 left-0 w-full p-1.5 z-20 text-white">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-[6px] font-bold">S</div>
                                  <span className="text-[7px] font-bold">Sarah J.</span>
                                </div>
                                <p className="text-[6px] opacity-90">just bought!</p>
                              </div>
                              <div className="absolute top-0 left-0 h-0.5 bg-white/30 w-full z-30">
                                <div className="h-full bg-white w-3/4"></div>
                              </div>
                            </div>
                          ) : preset.design?.layout?.layout === 'floating-tag' ? (
                            /* Special Floating Tag Preview */
                            <div className="relative flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-md" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                                  <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z"></path>
                                </svg>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-medium text-gray-800">Popular</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                <span className="text-[8px] text-gray-500">120 viewing</span>
                              </div>
                              <div className="absolute -top-0.5 -right-0.5">
                                <span className="flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                </span>
                              </div>
                            </div>
                          ) : preset.design?.layout?.layout === 'peekaboo' ? (
                            /* Special Peekaboo Reveal Preview */
                            <div className="relative flex items-center gap-2 p-2.5 pr-8 bg-white rounded-r-2xl rounded-l-lg shadow-md border border-gray-100" style={{ width: '200px' }}>
                              {/* Decoration dot */}
                              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                                <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                              </div>
                              
                              {/* Eye icon */}
                              <div className="relative shrink-0">
                                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </div>
                                <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[8px] font-semibold border-2 border-white" style={{ transform: 'translateX(10px) translateY(8px) scale(0.7)' }}>A</div>
                              </div>
                              
                              {/* Text */}
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-0.5 text-sm font-bold text-gray-900 leading-none">
                                  <span>18</span>
                                  <span className="text-[10px] font-medium text-gray-500">people viewed</span>
                                </div>
                                <div className="text-[8px] font-medium text-indigo-500 uppercase mt-0.5">In the last hour</div>
                              </div>
                            </div>
                          ) : preset.design?.layout?.layout === 'puzzle' ? (
                            /* Special Puzzle Reveal Preview */
                            <div className="flex items-center" style={{ height: '44px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}>
                              {/* Piece 1: Avatar */}
                              <div className="relative z-30 flex items-center justify-center w-11 h-11 bg-white rounded-l-xl rounded-r-md">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                >A</div>
                                <div className="absolute -right-1 w-2 h-2 bg-white rounded-full z-10"></div>
                              </div>
                              
                              {/* Piece 2: Message */}
                              <div className="relative z-20 -ml-1.5 flex flex-col justify-center px-3 h-11 bg-gray-900 text-white rounded-md min-w-[100px]">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="p-0.5 rounded-sm bg-yellow-400 text-gray-900">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                  </span>
                                  <span className="text-[7px] font-bold uppercase text-gray-400">purchased</span>
                                </div>
                                <div className="text-[9px] font-medium truncate">
                                  <span className="font-bold">Alex</span> got Neon High-Tops
                                </div>
                              </div>
                              
                              {/* Piece 3: Product */}
                              <div className="relative z-10 -ml-1.5 w-11 h-11 bg-white rounded-r-xl rounded-l-md overflow-hidden">
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rounded-full z-20"></div>
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : preset.design?.layout?.layout === 'parallax' ? (
                            /* Special Parallax 3D Card Preview */
                            <div 
                              className="relative rounded-lg p-3"
                              style={{ 
                                background: 'rgba(17, 24, 39, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                              }}
                            >
                              {/* Content */}
                              <div className="flex items-center gap-3">
                                {/* Product image */}
                                <div className="flex-shrink-0 relative">
                                  <div 
                                    className="w-10 h-10 rounded-md flex items-center justify-center"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    </svg>
                                  </div>
                                  {/* NEW badge */}
                                  <div 
                                    className="absolute -top-1 -right-1 text-white text-[7px] font-bold px-1 py-0.5 rounded"
                                    style={{ background: '#6366f1', border: '1px solid #818cf8' }}
                                  >
                                    NEW
                                  </div>
                                </div>
                                
                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="#facc15">
                                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                    </svg>
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Just Grabbed</span>
                                  </div>
                                  <h4 className="text-[11px] font-bold text-white truncate">AI Copywriter Pro</h4>
                                  <p className="text-[9px] text-gray-400 truncate">
                                    by <span className="text-gray-200">Nathan D.</span> • Marketing
                                  </p>
                                </div>
                              </div>
                              
                              {/* Bottom gradient */}
                              <div 
                                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
                                style={{ background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)', opacity: 0.5 }}
                              />
                            </div>
                          ) : preset.design?.layout?.layout === 'ripple' ? (
                            /* Special Ripple Bubble Preview */
                            <div 
                              className="flex items-center gap-2 bg-white rounded-full py-1.5 pl-1.5 pr-4"
                              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                            >
                              {/* Image cluster */}
                              <div className="relative flex-shrink-0" style={{ width: '44px', height: '32px' }}>
                                {/* User avatar (front) */}
                                <div 
                                  className="absolute rounded-full border-2 border-white flex items-center justify-center text-white font-semibold text-[10px]"
                                  style={{ 
                                    left: 0, 
                                    top: '1px', 
                                    width: '30px', 
                                    height: '30px', 
                                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                    zIndex: 2
                                  }}
                                >
                                  M
                                </div>
                                {/* Product (back) */}
                                <div 
                                  className="absolute rounded-full border-2 border-white"
                                  style={{ 
                                    left: '16px', 
                                    top: '1px', 
                                    width: '30px', 
                                    height: '30px', 
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    zIndex: 1
                                  }}
                                />
                                {/* Heart badge */}
                                <div 
                                  className="absolute bg-white rounded-full flex items-center justify-center"
                                  style={{ left: '18px', bottom: 0, zIndex: 3, width: '12px', height: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                                >
                                  <svg width="7" height="7" viewBox="0 0 24 24" fill="#ef4444">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                  </svg>
                                </div>
                              </div>
                              {/* Text */}
                              <div className="min-w-0">
                                <div className="text-[11px] text-gray-700">
                                  <span className="font-semibold text-indigo-500">Maya</span> from Toronto
                                </div>
                                <div className="text-[10px] text-gray-400">is looking at this</div>
                              </div>
                            </div>
                          ) : (
                            /* Standard preview */
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
                          )}
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
