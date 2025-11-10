import { useState } from 'react';
import { ArrowLeft, Save, ChevronDown, ChevronUp, Monitor, Smartphone, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useWidgetConfig } from '../../hooks/useWidgetConfig';
import {
  SettingsSection,
  SettingsGroup,
  SettingsRow,
  Select,
  NumberInput,
  TextInput,
  Toggle,
  ColorPicker,
  Slider,
  Divider,
} from './SettingsComponents';

interface WidgetEditorWithPreviewProps {
  widgetId: string;
  onBack?: () => void;
}

type AccordionSection = 'design' | 'triggers' | 'display' | 'branding' | 'webhooks';

// Helper function to convert shadow size to CSS box-shadow
function getShadowStyle(size: string): string {
  const shadows: Record<string, string> = {
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  };
  return shadows[size] || shadows['lg'];
}

const SAMPLE_LOCATION = {
  city: 'London',
  country: 'United Kingdom',
};

function getTemplateSample(templateId?: string) {
  console.log('Getting template sample for:', templateId); // Debug log
  
  switch (templateId) {
    case 'recent_purchase':
    case 'purchase':
      return {
        name: 'Sophia Martinez',
        event: 'just purchased the Growth Plan',
        value: 129,
      };
    case 'new_signup':
    case 'signup':
      return {
        name: 'Liam Chen',
        event: 'signed up from New York',
        value: null,
      };
    case 'customer_review':
    case 'customer_reviews':
    case 'review':
      return {
        name: 'Amelia Taylor',
        event: 'left a 5-star review',
        value: null,
        rating: 5,
        reviewContent: 'Amazing product! Exceeded my expectations. Highly recommend to anyone looking for quality and great service.',
      };
    case 'live_visitors':
    case 'visitor_active':
      return {
        name: 'Live Activity',
        event: '28 visitors browsing right now',
        value: null,
      };
    case 'form_submission':
    case 'form_submit':
      return {
        name: 'Emma Williams',
        event: 'submitted the contact form',
        value: null,
      };
    case 'cart_activity':
    case 'add_to_cart':
      return {
        name: 'Someone',
        event: 'added Premium Plan to cart',
        value: 99,
      };
    case 'active_sessions':
    case 'page_view':
      return {
        name: 'Live Sessions',
        event: '8 people on this page',
        value: null,
      };
    case 'recent_activity':
      return {
        name: 'Recent Activity',
        event: 'See what others are doing',
        value: null,
      };
    default:
      return {
        name: 'Alex Johnson',
        event: 'purchased the Starter Plan',
        value: 49,
      };
  }
}

function formatDisplayValue(
  value: number | string,
  format: string = 'currency',
  currency: string = 'USD',
  position: 'before' | 'after' = 'before'
): string {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return typeof value === 'string' ? value : '';
  }

  if (format === 'currency') {
    try {
      const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numericValue);
      if (position === 'after') {
        const simple = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numericValue);
        return `${simple} ${currency}`;
      }
      return formatted;
    } catch {
      return `${currency} ${numericValue.toFixed(2)}`;
    }
  }

  if (format === 'number') {
    return new Intl.NumberFormat().format(numericValue);
  }

  return typeof value === 'string' ? value : `${numericValue}`;
}

function getFormattedLocation(format: string, city: string, country: string): string {
  switch (format) {
    case 'city':
      return city;
    case 'city-country':
      return `${city}, ${country}`;
    case 'country':
      return country;
    case 'flag-emoji':
      return '🇬🇧';
    default:
      return `${city}, ${country}`;
  }
}

function anonymizeName(name: string, style: string): string {
  const [first = 'Customer', last = ''] = name.split(' ');
  switch (style) {
    case 'first-initial':
      return `${first} ${last ? `${last.charAt(0).toUpperCase()}.` : ''}`.trim();
    case 'first-last-initial':
      return `${first.charAt(0).toUpperCase()}. ${last ? `${last.charAt(0).toUpperCase()}.` : ''}`.trim();
    case 'random':
      return 'Happy Customer';
    default:
      return name;
  }
}

function getInitials(name: string): string {
  const [first = '', last = ''] = name.split(' ');
  if (!first && !last) return 'PP';
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return initials || first.slice(0, 2).toUpperCase() || 'PP';
}

export function WidgetEditorWithPreview({ widgetId, onBack }: WidgetEditorWithPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<AccordionSection>>(new Set(['design']));
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    config,
    loading,
    saving,
    error,
    updateConfig,
    saveConfig,
    resetConfig,
    isDirty,
  } = useWidgetConfig({
    widgetId,
    onSaveSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const toggleSection = (section: AccordionSection) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    await saveConfig();
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading widget configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex-1 bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Widget not found</p>
              <p className="text-red-700 text-sm mt-1">
                The widget you're looking for doesn't exist or you don't have permission to edit it.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displaySettings = config.display;
  
  // Check multiple possible locations for template_id
  const templateId = (config as any)?.template_id 
    || (config as any)?.config?.template_id 
    || (config as any)?.template_name?.toLowerCase().replace(/\s+/g, '_')
    || config.name?.toLowerCase().replace(/\s+/g, '_')
    || config.type;
    
  console.log('Widget config:', config); // Debug log
  console.log('Config name:', config.name); // Debug log
  console.log('Template ID resolved to:', templateId); // Debug log
  const sampleTemplate = getTemplateSample(templateId);
  const sampleNameOriginal = sampleTemplate.name;
  const sampleEvent = sampleTemplate.event;
  const sampleValue = sampleTemplate.value; // Keep null as null, don't convert to 0
  const sampleRating = (sampleTemplate as any).rating; // Rating for review widgets
  const sampleReviewContent = (sampleTemplate as any).reviewContent || (sampleTemplate as any).review_content; // Review text content (support both naming conventions)

  const sampleName = displaySettings.privacy.anonymizeNames
    ? anonymizeName(sampleNameOriginal, displaySettings.privacy.anonymizationStyle)
    : sampleNameOriginal;

  const initials = getInitials(sampleNameOriginal);

  const relativeTime = '10 mins ago';
  const absoluteTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  let timestampText = '';
  if (displaySettings.content.showTimestamp) {
    const prefix = displaySettings.content.timestampPrefix || '';
    if (displaySettings.content.timestampFormat === 'absolute') {
      timestampText = `${prefix}${absoluteTime}`;
    } else if (displaySettings.content.timestampFormat === 'both') {
      timestampText = `${prefix}${relativeTime} (${absoluteTime})`;
    } else {
      timestampText = `${prefix}${relativeTime}`;
    }
  }

  const locationText = displaySettings.content.showLocation
    ? getFormattedLocation(
        displaySettings.content.locationFormat,
        SAMPLE_LOCATION.city,
        SAMPLE_LOCATION.country
      )
    : '';

  const valueText = displaySettings.content.showValue && sampleValue != null
    ? formatDisplayValue(
        sampleValue as number,
        displaySettings.content.valueFormat,
        displaySettings.content.currency,
        displaySettings.content.currencyPosition
      )
    : '';

  const metaParts = [timestampText.trim(), locationText.trim()].filter(Boolean);
  const metaLine = metaParts.join(' • ');

  const progressBarPositionClass = displaySettings.duration.progressBarPosition === 'bottom'
    ? 'bottom-0'
    : 'top-0';

  const isClickable = displaySettings.interaction.clickable;
  const showCloseButton = displaySettings.interaction.closeButton;
  const closeButtonClass = displaySettings.interaction.closeButtonPosition === 'top-left'
    ? 'top-2 left-2'
    : 'top-2 right-2';

  const animationClass = (() => {
    switch (displaySettings.duration.animationType) {
      case 'fade':
        return 'animate-preview-fade';
      case 'bounce':
        return 'animate-preview-bounce';
      case 'zoom':
        return 'animate-preview-zoom';
      case 'none':
        return '';
      case 'slide':
      default:
        return 'animate-preview-slide';
    }
  })();

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
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
              <h1 className="text-xl font-semibold text-gray-900">{config.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Configure your widget settings</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              config.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {config.isActive ? 'Active' : 'Not Active'}
            </span>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(error || showSuccess) && (
        <div className="px-6 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
              <div>
                <p className="text-green-800 font-medium">Success</p>
                <p className="text-green-700 text-sm mt-1">
                  Widget configuration saved successfully
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content: Settings + Preview */}
      <div className="flex-1 bg-gray-50">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left: Settings Panel */}
          <div
            className="w-full lg:w-1/2 overflow-y-auto border-r border-gray-200 bg-white"
            style={{ maxHeight: 'calc(100vh - 112px)' }}
          >
            <div className="p-6 space-y-4">
              {/* Design Section */}
              <AccordionSection
                title="Design"
                isExpanded={expandedSections.has('design')}
                onToggle={() => toggleSection('design')}
              >
                <div className="space-y-6 pt-4">
                  {/* Position Settings */}
                  <SettingsSection title="Position" description="Choose where your widget appears on the page">
                    <SettingsGroup>
                      <SettingsRow label="Position" description="Widget placement on screen">
                        <Select
                          value={config?.design.position.position || 'bottom-left'}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              position: { ...config?.design.position, position: value as any }
                            }
                          })}
                          options={[
                            { value: 'bottom-left', label: 'Bottom Left' },
                            { value: 'bottom-right', label: 'Bottom Right' },
                            { value: 'top-left', label: 'Top Left' },
                            { value: 'top-right', label: 'Top Right' },
                            { value: 'center-top', label: 'Center Top' },
                          ]}
                          className="w-40"
                        />
                      </SettingsRow>

                      <SettingsRow label="Offset X" description="Horizontal distance from edge">
                        <NumberInput
                          value={config?.design.position.offsetX || 20}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              position: { ...config?.design.position, offsetX: value }
                            }
                          })}
                          min={0}
                          max={200}
                          suffix="px"
                        />
                      </SettingsRow>

                      <SettingsRow label="Offset Y" description="Vertical distance from edge">
                        <NumberInput
                          value={config?.design.position.offsetY || 20}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              position: { ...config?.design.position, offsetY: value }
                            }
                          })}
                          min={0}
                          max={200}
                          suffix="px"
                        />
                      </SettingsRow>

                      {/* <SettingsRow label="Stack Direction" description="How multiple notifications stack">
                        <Select
                          value={config?.design.position.stackDirection || 'vertical'}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              position: { ...config?.design.position, stackDirection: value as any }
                            }
                          })}
                          options={[
                            { value: 'vertical', label: 'Vertical' },
                            { value: 'horizontal', label: 'Horizontal' },
                          ]}
                          className="w-40"
                        />
                      </SettingsRow> */}

                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Layout Settings */}
                  <SettingsSection title="Layout" description="Control the size and style of your widget">
                    <SettingsGroup>
                      <SettingsRow label="Layout Style" description="Choose notification style">
                        <Select
                          value={config?.design.layout.layout || 'card'}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              layout: { ...config?.design.layout, layout: value as any }
                            }
                          })}
                          options={[
                            { value: 'card', label: 'Card' },
                            { value: 'compact', label: 'Compact' },
                            { value: 'minimal', label: 'Minimal' },
                            { value: 'full-width', label: 'Full Width' },
                          ]}
                          className="w-40"
                        />
                      </SettingsRow>

                      <SettingsRow label="Max Width" description="Maximum widget width">
                        <NumberInput
                          value={config?.design.layout.maxWidth || 280}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              layout: { ...config?.design.layout, maxWidth: value }
                            }
                          })}
                          min={180}
                          max={600}
                          step={10}
                          suffix="px"
                        />
                      </SettingsRow>

                      <SettingsRow label="Min Width" description="Minimum widget width">
                        <NumberInput
                          value={config?.design.layout.minWidth || 240}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              layout: { ...config?.design.layout, minWidth: value }
                            }
                          })}
                          min={180}
                          max={400}
                          step={10}
                          suffix="px"
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Border Settings */}
                  <SettingsSection title="Border" description="Customize border style and accent">
                    <SettingsGroup>
                      <SettingsRow label="Border Radius" description="Corner roundness">
                        <Slider
                          value={config?.design.border.borderRadius || 12}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              border: { ...config?.design.border, borderRadius: value }
                            }
                          })}
                          min={0}
                          max={30}
                          suffix="px"
                        />
                      </SettingsRow>

                      <SettingsRow label="Border Width" description="Border thickness">
                        <Slider
                          value={config?.design.border.borderWidth || 1}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              border: { ...config?.design.border, borderWidth: value }
                            }
                          })}
                          min={0}
                          max={5}
                          suffix="px"
                        />
                      </SettingsRow>

                      <SettingsRow label="Border Color" description="Main border color">
                        <ColorPicker
                          value={config?.design.border.borderColor || 'rgba(59, 130, 246, 0.2)'}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              border: { ...config?.design.border, borderColor: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Left Accent" description="Show colored left border">
                        <Toggle
                          checked={config?.design.border.borderLeftAccent ?? true}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              border: { ...config?.design.border, borderLeftAccent: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config?.design.border.borderLeftAccent && (
                        <>
                          <SettingsRow label="Accent Width" description="Left accent thickness">
                            <Slider
                              value={config?.design.border.borderLeftAccentWidth || 4}
                              onChange={(value) => updateConfig({
                                design: {
                                  ...config?.design,
                                  border: { ...config?.design.border, borderLeftAccentWidth: value }
                                }
                              })}
                              min={1}
                              max={10}
                              suffix="px"
                            />
                          </SettingsRow>

                          <SettingsRow label="Accent Color" description="Left accent color">
                            <ColorPicker
                              value={config?.design.border.borderLeftAccentColor || '#3B82F6'}
                              onChange={(value) => updateConfig({
                                design: {
                                  ...config?.design,
                                  border: { ...config?.design.border, borderLeftAccentColor: value }
                                }
                              })}
                            />
                          </SettingsRow>
                        </>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Shadow & Effects */}
                  <SettingsSection title="Shadow & Effects" description="Add depth and visual effects">
                    <SettingsGroup>
                      <SettingsRow label="Shadow Enabled" description="Show drop shadow">
                        <Toggle
                          checked={config?.design.shadow.shadowEnabled ?? true}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              shadow: { ...config?.design.shadow, shadowEnabled: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config?.design.shadow.shadowEnabled && (
                        <>
                          <SettingsRow label="Shadow Size" description="Shadow intensity">
                            <Select
                              value={config?.design.shadow.shadowSize || 'lg'}
                              onChange={(value) => updateConfig({
                                design: {
                                  ...config?.design,
                                  shadow: { ...config?.design.shadow, shadowSize: value as any }
                                }
                              })}
                              options={[
                                { value: 'sm', label: 'Small' },
                                { value: 'md', label: 'Medium' },
                                { value: 'lg', label: 'Large' },
                                { value: 'xl', label: 'Extra Large' },
                                { value: '2xl', label: '2X Large' },
                              ]}
                              className="w-40"
                            />
                          </SettingsRow>
                        </>
                      )}

                      <SettingsRow label="Glassmorphism" description="Modern glass effect">
                        <Toggle
                          checked={config?.design.shadow.glassmorphism ?? true}
                          onChange={(value) => updateConfig({
                            design: {
                              ...config?.design,
                              shadow: { ...config?.design.shadow, glassmorphism: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config?.design.shadow.glassmorphism && (
                        <SettingsRow label="Backdrop Blur" description="Background blur amount (0-30px)">
                          <Slider
                            value={config?.design.shadow.backdropBlur ?? 16}
                            onChange={(value) => updateConfig({
                              design: {
                                ...config?.design,
                                shadow: { ...config?.design.shadow, backdropBlur: value }
                              }
                            })}
                            min={0}
                            max={30}
                            suffix="px"
                          />
                        </SettingsRow>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  {!config?.design?.shadow?.glassmorphism && (
                    <>
                      <Divider />

                      {/* Background */}
                      <SettingsSection title="Background" description="Set background colors and gradients">
                        <SettingsGroup>
                          <SettingsRow label="Background Color" description="Main background color">
                            <ColorPicker
                              value={config?.design.background.backgroundColor || 'rgba(255, 255, 255, 0.95)'}
                              onChange={(value) => updateConfig({
                                design: {
                                  ...config?.design,
                                  background: { ...config?.design.background, backgroundColor: value }
                                }
                              })}
                            />
                          </SettingsRow>
                        </SettingsGroup>
                      </SettingsSection>
                    </>
                  )}

                </div>
              </AccordionSection>

              {/* Triggers Section */}
              <AccordionSection
                title="Triggers"
                isExpanded={expandedSections.has('triggers')}
                onToggle={() => toggleSection('triggers')}
              >
                <div className="space-y-6 pt-4">
                  <p className="text-sm text-gray-600">
                    Define when and how your widget should appear based on user behavior and events.
                  </p>

                  {/* Trigger on Pages */}
                  <SettingsSection
                    title="Trigger on pages"
                    description="Where should the notification show?"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Trigger on all pages" description="Show on every page of your site">
                        <Toggle
                          checked={(config.triggers.advanced?.urlPatterns?.include?.length ?? 0) === 0}
                          onChange={(value) => updateConfig({
                            triggers: {
                              ...config.triggers,
                              advanced: {
                                ...config.triggers.advanced,
                                urlPatterns: {
                                  ...config.triggers.advanced?.urlPatterns,
                                  include: value ? [] : ['https://']
                                }
                              }
                            }
                          })}
                        />
                      </SettingsRow>

                      {(config.triggers.advanced?.urlPatterns?.include?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                          {config.triggers.advanced?.urlPatterns?.include?.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Select
                                value={config.triggers.advanced?.urlPatterns?.matchTypes?.[index] || 'contains'}
                                onChange={(value) => {
                                  const matchTypes = config.triggers.advanced?.urlPatterns?.matchTypes || [];
                                  const newMatchTypes = [...matchTypes];
                                  newMatchTypes[index] = value as any;
                                  updateConfig({
                                    triggers: {
                                      ...config.triggers,
                                      advanced: {
                                        ...config.triggers.advanced,
                                        urlPatterns: {
                                          ...config.triggers.advanced?.urlPatterns,
                                          matchTypes: newMatchTypes
                                        }
                                      }
                                    }
                                  });
                                }}
                                options={[
                                  { value: 'exact', label: 'Exact match' },
                                  { value: 'contains', label: 'Contains' },
                                  { value: 'starts', label: 'Starts with' },
                                ]}
                                className="w-32"
                              />
                              <input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                  const newUrls = [...(config.triggers.advanced?.urlPatterns?.include || [])];
                                  newUrls[index] = e.target.value;
                                  updateConfig({
                                    triggers: {
                                      ...config.triggers,
                                      advanced: {
                                        ...config.triggers.advanced,
                                        urlPatterns: {
                                          ...config.triggers.advanced?.urlPatterns,
                                          include: newUrls
                                        }
                                      }
                                    }
                                  });
                                }}
                                placeholder="Full URL (ex: https://example.com/page)"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                              <button
                                onClick={() => {
                                  const newUrls = config.triggers.advanced?.urlPatterns?.include?.filter((_, i) => i !== index) || [];
                                  updateConfig({
                                    triggers: {
                                      ...config.triggers,
                                      advanced: {
                                        ...config.triggers.advanced,
                                        urlPatterns: {
                                          ...config.triggers.advanced?.urlPatterns,
                                          include: newUrls
                                        }
                                      }
                                    }
                                  });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const currentUrls = config.triggers.advanced?.urlPatterns?.include || [];
                              updateConfig({
                                triggers: {
                                  ...config.triggers,
                                  advanced: {
                                    ...config.triggers.advanced,
                                    urlPatterns: {
                                      ...config.triggers.advanced?.urlPatterns,
                                      include: [...currentUrls, 'https://']
                                    }
                                  }
                                }
                              });
                            }}
                            className="flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            <span>+</span>
                            <span>Add new trigger</span>
                          </button>
                        </div>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  {/* Display Trigger */}
                  <SettingsSection
                    title="Display Trigger"
                    description="On what event the notification should show up"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Delay" description="Number of seconds to wait">
                        <Select
                          value={config.triggers.behavior.showAfterDelay.toString()}
                          onChange={(value) => updateConfig({
                            triggers: {
                              ...config.triggers,
                              behavior: { ...config.triggers.behavior, showAfterDelay: parseInt(value) }
                            }
                          })}
                          options={[
                            { value: '0', label: 'Immediately' },
                            { value: '3', label: '3 seconds' },
                            { value: '5', label: '5 seconds' },
                            { value: '10', label: '10 seconds' },
                            { value: '15', label: '15 seconds' },
                            { value: '30', label: '30 seconds' },
                          ]}
                          className="w-48"
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>

                  {/* Display Frequency */}
                  <SettingsSection
                    title="Display frequency"
                    description="How often should the notification trigger?"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Frequency" description="How often should the notification trigger?">
                        <Select
                          value={config.triggers.frequency?.displayFrequency || 'all_time'}
                          onChange={(value) => updateConfig({
                            triggers: {
                              ...config.triggers,
                              frequency: {
                                ...config.triggers.frequency,
                                displayFrequency: value as 'all_time' | 'once_per_session' | 'once_per_day',
                                maxNotificationsPerSession: value === 'once_per_session' ? 1 : 
                                  value === 'once_per_day' ? 1 : 
                                  config.triggers.frequency?.maxNotificationsPerSession || 3
                              }
                            }
                          })}
                          options={[
                            { value: 'all_time', label: 'All the time' },
                            { value: 'once_per_session', label: 'Once per session' },
                            { value: 'once_per_day', label: 'Once per day' },
                          ]}
                          className="w-48"
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>

                  {/* Device Display */}
                  <SettingsSection
                    title="Device Display"
                    description="Control which devices show notifications"
                  >
                    <SettingsGroup>
                      <SettingsRow 
                        label="Display on small screens" 
                        description="Display the notification when pixels available are smaller than 768px"
                      >
                        <Toggle
                          checked={!config.display.responsive.hideOnMobile}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              responsive: { ...config.display.responsive, hideOnMobile: !value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow 
                        label="Display on large screens" 
                        description="Display the notification when pixels available are bigger than 768px"
                      >
                        <Toggle
                          checked={!config.display.responsive.hideOnDesktop}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              responsive: { ...config.display.responsive, hideOnDesktop: !value }
                            }
                          })}
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>

                </div>
              </AccordionSection>

              {/* Display Section */}
              <AccordionSection
                title="Display"
                isExpanded={expandedSections.has('display')}
                onToggle={() => toggleSection('display')}
              >
                <div className="space-y-6 pt-4">
                  <p className="text-sm text-gray-600">
                    Control timing, content, interactions, and responsive behaviour for this widget.
                  </p>

                  {/* Duration */}
                  <SettingsSection
                    title="Timing"
                    description="Control display duration and animation behaviour"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Display Duration" description="How long each notification stays visible">
                        <Slider
                          value={config.display.duration.displayDuration}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              duration: { ...config.display.duration, displayDuration: value }
                            }
                          })}
                          min={2}
                          max={20}
                          suffix="s"
                        />
                      </SettingsRow>

                      <SettingsRow label="Animation Style" description="Choose how notifications enter">
                        <Select
                          value={config.display.duration.animationType}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              duration: { ...config.display.duration, animationType: value as any }
                            }
                          })}
                          options={[
                            { value: 'slide', label: 'Slide' },
                            { value: 'fade', label: 'Fade' },
                            { value: 'bounce', label: 'Bounce' },
                            { value: 'zoom', label: 'Zoom' },
                            { value: 'none', label: 'None' },
                          ]}
                          className="w-48"
                        />
                      </SettingsRow>

                      {config.display.duration.animationType === 'fade' && (
                        <>
                          <SettingsRow label="Fade In" description="Duration for fade-in animation">
                            <NumberInput
                              value={config.display.duration.fadeInDuration / 1000}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  duration: { ...config.display.duration, fadeInDuration: value * 1000 }
                                }
                              })}
                              min={0}
                              max={2}
                              step={0.1}
                              suffix="sec"
                            />
                          </SettingsRow>

                          <SettingsRow label="Fade Out" description="Duration for fade-out animation">
                            <NumberInput
                              value={config.display.duration.fadeOutDuration / 1000}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  duration: { ...config.display.duration, fadeOutDuration: value * 1000 }
                                }
                              })}
                              min={0}
                              max={2}
                              step={0.1}
                              suffix="sec"
                            />
                          </SettingsRow>
                        </>
                      )}

                      <SettingsRow
                        label="Progress Bar"
                        description="Show a visual countdown while notification is on screen"
                      >
                        <Toggle
                          checked={config.display.duration.progressBar}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              duration: { ...config.display.duration, progressBar: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.display.duration.progressBar && (
                        <>
                          <SettingsRow label="Progress Bar Position">
                            <Select
                              value={config.display.duration.progressBarPosition}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  duration: { ...config.display.duration, progressBarPosition: value as any }
                                }
                              })}
                              options={[
                                { value: 'top', label: 'Top' },
                                { value: 'bottom', label: 'Bottom' },
                              ]}
                              className="w-40"
                            />
                          </SettingsRow>
                          <SettingsRow label="Progress Bar Color">
                            <ColorPicker
                              value={config.display.duration.progressBarColor}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  duration: { ...config.display.duration, progressBarColor: value }
                                }
                              })}
                            />
                          </SettingsRow>
                        </>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Content */}
                  <SettingsSection
                    title="Content"
                    description="Choose what information appears in each notification"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Show Timestamp">
                        <Toggle
                          checked={config.display.content.showTimestamp}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showTimestamp: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.display.content.showTimestamp && (
                        <>
                          <SettingsRow label="Timestamp Format">
                            <Select
                              value={config.display.content.timestampFormat}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  content: { ...config.display.content, timestampFormat: value as any }
                                }
                              })}
                              options={[
                                { value: 'relative', label: 'Relative ("5 mins ago")' },
                                { value: 'absolute', label: 'Absolute ("2 Nov 2025")' },
                                { value: 'both', label: 'Show both' },
                              ]}
                              className="w-60"
                            />
                          </SettingsRow>
                          <SettingsRow label="Timestamp Prefix" description="Optional text before timestamp">
                            <TextInput
                              value={config.display.content.timestampPrefix}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  content: { ...config.display.content, timestampPrefix: value }
                                }
                              })}
                              className="w-32"
                            />
                          </SettingsRow>
                        </>
                      )}

                      <SettingsRow label="Show Location">
                        <Toggle
                          checked={config.display.content.showLocation}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showLocation: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.display.content.showLocation && (
                        <SettingsRow label="Location Format">
                          <Select
                            value={config.display.content.locationFormat}
                            onChange={(value) => updateConfig({
                              display: {
                                ...config.display,
                                content: { ...config.display.content, locationFormat: value as any }
                              }
                            })}
                            options={[
                              { value: 'city', label: 'City' },
                              { value: 'city-country', label: 'City + Country' },
                              { value: 'country', label: 'Country' },
                            ]}
                            className="w-48"
                          />
                        </SettingsRow>
                      )}

                      <SettingsRow label="Show Customer Name" description="Display the customer/user name">
                        <Toggle
                          checked={config.display.content.showCustomerName}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showCustomerName: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Show User Avatar">
                        <Toggle
                          checked={config.display.content.showUserAvatar}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showUserAvatar: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Show Rating" description="Display rating stars for review notifications">
                        <Toggle
                          checked={config.display.content.showRating}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showRating: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Show Review Content" description="Display the review text content">
                        <Toggle
                          checked={config.display.content.showReviewContent}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showReviewContent: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Show Value">
                        <Toggle
                          checked={config.display.content.showValue}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { ...config.display.content, showValue: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.display.content.showValue && (
                        <>
                          <SettingsRow label="Value Format">
                            <Select
                              value={config.display.content.valueFormat}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  content: { ...config.display.content, valueFormat: value as any }
                                }
                              })}
                              options={[
                                { value: 'currency', label: 'Currency' },
                                { value: 'number', label: 'Number' },
                                { value: 'text', label: 'Text' },
                              ]}
                              className="w-40"
                            />
                          </SettingsRow>
                          {config.display.content.valueFormat === 'currency' && (
                            <>
                              <SettingsRow label="Currency Code">
                                <TextInput
                                  value={config.display.content.currency}
                                  onChange={(value) => updateConfig({
                                    display: {
                                      ...config.display,
                                      content: { ...config.display.content, currency: value.toUpperCase() }
                                    }
                                  })}
                                  className="w-24 uppercase"
                                />
                              </SettingsRow>
                              <SettingsRow label="Currency Position">
                                <Select
                                  value={config.display.content.currencyPosition}
                                  onChange={(value) => updateConfig({
                                    display: {
                                      ...config.display,
                                      content: { ...config.display.content, currencyPosition: value as any }
                                    }
                                  })}
                                  options={[
                                    { value: 'before', label: 'Before value ($25)' },
                                    { value: 'after', label: 'After value (25$)' },
                                  ]}
                                  className="w-52"
                                />
                              </SettingsRow>
                            </>
                          )}
                        </>
                      )}

                      <SettingsRow 
                        label="Notification Time Range" 
                        description="Show notifications from this time period"
                      >
                        <Select
                          value={config.display.content.notificationTimeRange?.toString() || '168'}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              content: { 
                                ...config.display.content, 
                                notificationTimeRange: Number(value),
                                customTimeRangeHours: Number(value) === 0 ? config.display.content.customTimeRangeHours : undefined
                              }
                            }
                          })}
                          options={[
                            { value: '1', label: 'Last 1 hour' },
                            { value: '24', label: 'Last 24 hours' },
                            { value: '48', label: 'Last 2 days' },
                            { value: '168', label: 'Last 7 days' },
                            { value: '720', label: 'Last 30 days' },
                            { value: '0', label: 'Custom' },
                          ]}
                          className="w-48"
                        />
                      </SettingsRow>

                      {config.display.content.notificationTimeRange === 0 && (
                        <SettingsRow label="Custom Hours" description="Number of hours to look back">
                          <NumberInput
                            value={config.display.content.customTimeRangeHours || 168}
                            onChange={(value) => updateConfig({
                              display: {
                                ...config.display,
                                content: { ...config.display.content, customTimeRangeHours: value }
                              }
                            })}
                            min={1}
                            max={8760}
                            step={1}
                          />
                        </SettingsRow>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Privacy */}
                  <SettingsSection
                    title="Privacy"
                    description="Protect visitor identities while showcasing social proof"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Anonymize Names">
                        <Toggle
                          checked={config.display.privacy.anonymizeNames}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              privacy: { ...config.display.privacy, anonymizeNames: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.display.privacy.anonymizeNames && (
                        <SettingsRow label="Anonymization Style">
                          <Select
                            value={config.display.privacy.anonymizationStyle}
                            onChange={(value) => updateConfig({
                              display: {
                                ...config.display,
                                privacy: { ...config.display.privacy, anonymizationStyle: value as any }
                              }
                            })}
                            options={[
                              { value: 'first-initial', label: 'First name + last initial' },
                              { value: 'first-last-initial', label: 'First initial + last initial' },
                              { value: 'random', label: 'Random alias' },
                            ]}
                            className="w-56"
                          />
                        </SettingsRow>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Interaction */}
                  <SettingsSection
                    title="Interaction"
                    description="Define how visitors can interact with the widget"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Widget is Clickable">
                        <Toggle
                          checked={config.display.interaction.clickable}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              interaction: { ...config.display.interaction, clickable: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.display.interaction.clickable && (
                        <SettingsRow label="Click Action">
                          <Select
                            value={config.display.interaction.clickAction}
                            onChange={(value) => updateConfig({
                              display: {
                                ...config.display,
                                interaction: { ...config.display.interaction, clickAction: value as any }
                              }
                            })}
                            options={[
                              { value: 'none', label: 'Do nothing' },
                              { value: 'url', label: 'Open link' },
                              { value: 'close', label: 'Dismiss notification' },
                              { value: 'custom', label: 'Trigger custom callback' },
                            ]}
                            className="w-56"
                          />
                        </SettingsRow>
                      )}

                      {config.display.interaction.clickable && config.display.interaction.clickAction === 'url' && (
                        <>
                          <SettingsRow label="Click URL">
                            <TextInput
                              value={config.display.interaction.clickUrl || ''}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  interaction: { ...config.display.interaction, clickUrl: value }
                                }
                              })}
                              placeholder="https://example.com"
                              type="url"
                              className="w-80"
                            />
                          </SettingsRow>
                          <SettingsRow label="Open Link In">
                            <Select
                              value={config.display.interaction.clickUrlTarget}
                              onChange={(value) => updateConfig({
                                display: {
                                  ...config.display,
                                  interaction: { ...config.display.interaction, clickUrlTarget: value as any }
                                }
                              })}
                              options={[
                                { value: '_blank', label: 'New tab' },
                                { value: '_self', label: 'Same tab' },
                              ]}
                              className="w-40"
                            />
                          </SettingsRow>
                        </>
                      )}

                      <SettingsRow label="Show Close Button">
                        <Toggle
                          checked={config.display.interaction.closeButton}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              interaction: { ...config.display.interaction, closeButton: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Pause on Hover">
                        <Toggle
                          checked={config.display.interaction.pauseOnHover}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              interaction: { ...config.display.interaction, pauseOnHover: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Expand on Hover">
                        <Toggle
                          checked={config.display.interaction.expandOnHover}
                          onChange={(value) => updateConfig({
                            display: {
                              ...config.display,
                              interaction: { ...config.display.interaction, expandOnHover: value }
                            }
                          })}
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>
                </div>
              </AccordionSection>

              {/* Customize & Branding Section */}
              <AccordionSection
                title="Customize & Branding"
                isExpanded={expandedSections.has('branding')}
                onToggle={() => toggleSection('branding')}
              >
                <div className="space-y-6 pt-4">
                  <p className="text-sm text-gray-600">
                    Add your brand identity, custom templates, and styling to match your website.
                  </p>

                  {/* Identity */}
                  <SettingsSection
                    title="Brand Identity"
                    description="Add your logo and brand information"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Show Brand Logo" description="Display your logo in notifications">
                        <Toggle
                          checked={config.branding.identity.showBrandLogo}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              identity: { ...config.branding.identity, showBrandLogo: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.branding.identity.showBrandLogo && (
                        <>
                          <SettingsRow label="Logo URL" description="HTTPS URL to your logo image">
                            <input
                              type="url"
                              value={config.branding.identity.brandLogoUrl || ''}
                              onChange={(e) => updateConfig({
                                branding: {
                                  ...config.branding,
                                  identity: { ...config.branding.identity, brandLogoUrl: e.target.value || undefined }
                                }
                              })}
                              placeholder="https://example.com/logo.png"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </SettingsRow>

                          <SettingsRow label="Logo Position" description="Where to show the logo">
                            <Select
                              value={config.branding.identity.brandLogoPosition}
                              onChange={(value) => updateConfig({
                                branding: {
                                  ...config.branding,
                                  identity: { ...config.branding.identity, brandLogoPosition: value as any }
                                }
                              })}
                              options={[
                                { value: 'left', label: 'Left' },
                                { value: 'right', label: 'Right' },
                                { value: 'center', label: 'Center' },
                              ]}
                              className="w-40"
                            />
                          </SettingsRow>

                          <SettingsRow label="Logo Size" description="Logo height in pixels">
                            <Slider
                              value={config.branding.identity.brandLogoSize}
                              onChange={(value) => updateConfig({
                                branding: {
                                  ...config.branding,
                                  identity: { ...config.branding.identity, brandLogoSize: value }
                                }
                              })}
                              min={16}
                              max={64}
                              suffix="px"
                            />
                          </SettingsRow>
                        </>
                      )}

                      <SettingsRow label="Brand Name" description="Your company or product name">
                        <input
                          type="text"
                          value={config.branding.identity.brandName || ''}
                          onChange={(e) => updateConfig({
                            branding: {
                              ...config.branding,
                              identity: { ...config.branding.identity, brandName: e.target.value || undefined }
                            }
                          })}
                          placeholder="Acme Inc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </SettingsRow>

                      <SettingsRow label="Show 'Powered by'" description="Display ProofPop branding">
                        <Toggle
                          checked={config.branding.identity.showPoweredBy}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              identity: { ...config.branding.identity, showPoweredBy: value }
                            }
                          })}
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>

                  {/* Color Scheme */}
                  <SettingsSection
                    title="Color Scheme"
                    description="Customize colors to match your brand"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Primary Color" description="Main brand color">
                        <ColorPicker
                          value={config.branding.colorScheme.primaryColor}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              colorScheme: { ...config.branding.colorScheme, primaryColor: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Secondary Color" description="Accent and highlights">
                        <ColorPicker
                          value={config.branding.colorScheme.secondaryColor}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              colorScheme: { ...config.branding.colorScheme, secondaryColor: value }
                            }
                          })}
                        />
                      </SettingsRow>

                      <SettingsRow label="Link Color" description="Clickable elements">
                        <ColorPicker
                          value={config.branding.colorScheme.linkColor}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              colorScheme: { ...config.branding.colorScheme, linkColor: value }
                            }
                          })}
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection>

                  {/* Message Templates
                  <SettingsSection
                    title="Message Templates"
                    description="Customize notification messages with variables"
                  >
                    <SettingsGroup>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs mb-4">
                        <div className="font-semibold text-blue-900 mb-2">Available Variables:</div>
                        <div className="grid grid-cols-2 gap-2 text-blue-700">
                          <div><code className="bg-blue-100 px-1 rounded">{'{customer_name}'}</code> - Customer name</div>
                          <div><code className="bg-blue-100 px-1 rounded">{'{product_name}'}</code> - Product name</div>
                          <div><code className="bg-blue-100 px-1 rounded">{'{location}'}</code> - Location</div>
                          <div><code className="bg-blue-100 px-1 rounded">{'{value}'}</code> - Purchase amount</div>
                          <div><code className="bg-blue-100 px-1 rounded">{'{rating}'}</code> - Review rating</div>
                          <div><code className="bg-blue-100 px-1 rounded">{'{time_ago}'}</code> - Time ago</div>
                        </div>
                      </div>

                      <SettingsRow label="Purchase Template" description="Message for purchase events">
                        <input
                          type="text"
                          value={config.branding.templates.templatesByEventType.purchase.message}
                          onChange={(e) => updateConfig({
                            branding: {
                              ...config.branding,
                              templates: {
                                ...config.branding.templates,
                                templatesByEventType: {
                                  ...config.branding.templates.templatesByEventType,
                                  purchase: {
                                    ...config.branding.templates.templatesByEventType.purchase,
                                    message: e.target.value
                                  }
                                }
                              }
                            }
                          })}
                          placeholder="purchased {product_name}"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </SettingsRow>

                      <SettingsRow label="Signup Template" description="Message for signup events">
                        <input
                          type="text"
                          value={config.branding.templates.templatesByEventType.signup.message}
                          onChange={(e) => updateConfig({
                            branding: {
                              ...config.branding,
                              templates: {
                                ...config.branding.templates,
                                templatesByEventType: {
                                  ...config.branding.templates.templatesByEventType,
                                  signup: {
                                    ...config.branding.templates.templatesByEventType.signup,
                                    message: e.target.value
                                  }
                                }
                              }
                            }
                          })}
                          placeholder="just signed up"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </SettingsRow>

                      <SettingsRow label="Review Template" description="Message for review events">
                        <input
                          type="text"
                          value={config.branding.templates.templatesByEventType.review.message}
                          onChange={(e) => updateConfig({
                            branding: {
                              ...config.branding,
                              templates: {
                                ...config.branding.templates,
                                templatesByEventType: {
                                  ...config.branding.templates.templatesByEventType,
                                  review: {
                                    ...config.branding.templates.templatesByEventType.review,
                                    message: e.target.value
                                  }
                                }
                              }
                            }
                          })}
                          placeholder="left a {rating}-star review"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        />
                      </SettingsRow>
                    </SettingsGroup>
                  </SettingsSection> */}

                  {/* Custom CSS */}
                  {/* <SettingsSection
                    title="Custom CSS"
                    description="Advanced styling for developers"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Custom CSS" description="Add custom CSS styles">
                        <textarea
                          value={config.branding.customCSS.customCSS}
                          onChange={(e) => updateConfig({
                            branding: {
                              ...config.branding,
                              customCSS: { ...config.branding.customCSS, customCSS: e.target.value }
                            }
                          })}
                          placeholder=".proofpop-widget { font-family: 'Custom Font'; }"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                          rows={4}
                        />
                      </SettingsRow>

                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                        <strong>Target classes:</strong> <code>.proofpop-widget</code>, <code>.proofpop-notification</code>, <code>.proofpop-title</code>, <code>.proofpop-message</code>
                      </div>
                    </SettingsGroup>
                  </SettingsSection> */}

                  {/* Localization */}
                  {/* <SettingsSection
                    title="Localization (i18n)"
                    description="Multi-language support"
                  >
                    <SettingsGroup>
                      <SettingsRow label="Language" description="Default language">
                        <Select
                          value={config.branding.localization.language}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              localization: { ...config.branding.localization, language: value as any }
                            }
                          })}
                          options={[
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Español' },
                            { value: 'fr', label: 'Français' },
                            { value: 'de', label: 'Deutsch' },
                            { value: 'it', label: 'Italiano' },
                            { value: 'pt', label: 'Português' },
                            { value: 'ja', label: '日本語' },
                            { value: 'zh', label: '中文' },
                          ]}
                          className="w-48"
                        />
                      </SettingsRow>

                      <SettingsRow label="Auto-detect Language" description="Detect visitor's browser language">
                        <Toggle
                          checked={config.branding.localization.autoDetectLanguage}
                          onChange={(value) => updateConfig({
                            branding: {
                              ...config.branding,
                              localization: { ...config.branding.localization, autoDetectLanguage: value }
                            }
                          })}
                        />
                      </SettingsRow>

                       <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                        Full translation editor coming soon. Configure custom translations for each language.
                      </div> 
                    </SettingsGroup>
                  </SettingsSection>
                   */}
                  
                </div>
              </AccordionSection>

              {/* Webhook & Auto Capture Section */}
              <AccordionSection
                title="Webhook & Auto Capture"
                isExpanded={expandedSections.has('webhooks')}
                onToggle={() => toggleSection('webhooks')}
              >
                <div className="space-y-6 pt-4">
                  <p className="text-sm text-gray-600">
                    Set up webhooks, form tracking, click events, and automated data capture.
                  </p>

                  {/* Webhook Trigger */}
                  <SettingsSection
                    title="Webhook Trigger"
                    description="Call this endpoint to send events to this notification"
                  >
                    <SettingsGroup>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={`https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event`}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event');
                              alert('Webhook URL copied to clipboard!');
                            }}
                            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Call the endpoint to let us know about an event or conversion that happened on your website related to this notification. we'll handle the rest. The call MUST be a POST request and can have any form data parameters.
                        </p>
                      </div>
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Auto Capture Data */}
                  <SettingsSection
                    title="Auto Capture Data"
                    description="Automatically detect and record form submissions"
                  >
                    <SettingsGroup>
                      <SettingsRow 
                        label="Enable Auto Capture" 
                        description="Setting the Auto Capture will attempt to automatically detect when a form has been submitted and record that data for you. (Password fields will never be captured.)"
                      >
                        <Toggle
                          checked={config.webhooks?.autoCapture?.enabled ?? true}
                          onChange={(value) => updateConfig({
                            webhooks: {
                              ...config.webhooks,
                              autoCapture: {
                                ...config.webhooks?.autoCapture,
                                enabled: value
                              }
                            }
                          })}
                        />
                      </SettingsRow>

                      {config.webhooks?.autoCapture?.enabled && (
                        <>
                          <SettingsRow label="Exact match" description="Match specific form by ID or class">
                            <input
                              type="text"
                              placeholder="e.g., #contact-form, .signup-form"
                              value={config.webhooks?.autoCapture?.exactMatch ?? ''}
                              onChange={(e) => updateConfig({
                                webhooks: {
                                  ...config.webhooks,
                                  autoCapture: {
                                    ...config.webhooks?.autoCapture,
                                    enabled: config.webhooks?.autoCapture?.enabled ?? true,
                                    exactMatch: e.target.value
                                  }
                                }
                              })}
                              className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </SettingsRow>

                          <SettingsRow label="Full URL" description="Capture forms only on specific pages">
                            <input
                              type="text"
                              placeholder="e.g., https://example.com/contact"
                              value={config.webhooks?.autoCapture?.fullUrl ?? ''}
                              onChange={(e) => updateConfig({
                                webhooks: {
                                  ...config.webhooks,
                                  autoCapture: {
                                    ...config.webhooks?.autoCapture,
                                    enabled: config.webhooks?.autoCapture?.enabled ?? true,
                                    fullUrl: e.target.value
                                  }
                                }
                              })}
                              className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </SettingsRow>
                        </>
                      )}
                    </SettingsGroup>
                  </SettingsSection>

                  <Divider />

                  {/* Select Widget Version */}
                  <SettingsSection
                    title="Select Widget Version"
                    description="Choose how to integrate the widget"
                  >
                    <SettingsGroup>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="widgetVersion"
                            checked={config.webhooks?.widgetVersion !== 'plugin'}
                            onChange={() => updateConfig({
                              webhooks: {
                                ...config.webhooks,
                                widgetVersion: 'webhook'
                              }
                            })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Webhook and Upload</div>
                            <div className="text-xs text-gray-500">Use our pixel + manual event tracking</div>
                          </div>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="widgetVersion"
                            checked={config.webhooks?.widgetVersion === 'plugin'}
                            onChange={() => updateConfig({
                              webhooks: {
                                ...config.webhooks,
                                widgetVersion: 'plugin'
                              }
                            })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Plugin</div>
                            <div className="text-xs text-gray-500">Platform-specific integration (Shopify, WordPress, etc.)</div>
                          </div>
                        </label>
                      </div>
                    </SettingsGroup>
                  </SettingsSection>
                </div>
              </AccordionSection>
            </div>
          </div>

          {/* Right: Preview Panel */}
          <div className="hidden lg:block lg:w-1/2 bg-gray-100">
            <div className="sticky top-24 p-6 space-y-4 max-h-[calc(100vh-112px)] overflow-y-auto">
              {/* Preview Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Preview</span>
                  </div>
                  
                  {/* Device Toggle */}
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Monitor className="w-4 h-4 inline mr-1" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 inline mr-1" />
                      Mobile
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Container */}
              <div className={`bg-white rounded-lg shadow-lg border border-gray-300 mx-auto transition-all ${
                previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
              }`}>
                <div 
                  className={`p-8 ${previewDevice === 'mobile' ? 'min-h-[600px]' : 'min-h-[500px]'} relative`}
                  style={{
                    background: config?.design?.shadow?.glassmorphism 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#f9fafb'
                  }}
                >
                  {/* Live Widget Preview */}
                  {(() => {
                    const effectivePosition = previewDevice === 'mobile' && config?.display?.responsive?.mobilePosition
                      ? config.display.responsive.mobilePosition
                      : config?.design?.position?.position || 'bottom-left';
                    
                    const blurAmount = config?.design?.shadow?.backdropBlur ?? 16;
                    if (config?.design?.shadow?.glassmorphism) {
                      console.log('Glassmorphism enabled - Blur amount:', blurAmount);
                    }
                    
                    return (
                      <div
                        key={`${displaySettings.duration.animationType}-blur-${blurAmount}`}
                        className={`absolute ${animationClass}`}
                        style={{
                          bottom: effectivePosition.includes('bottom') ? `${config?.design?.position?.offsetY || 20}px` : 'auto',
                          left: effectivePosition.includes('left') || effectivePosition === 'center-top'
                            ? effectivePosition === 'center-top' ? '50%' : `${config?.design?.position?.offsetX || 20}px`
                            : 'auto',
                          right: effectivePosition.includes('right')
                            ? `${config?.design?.position?.offsetX || 20}px`
                            : 'auto',
                          top: effectivePosition.includes('top') || effectivePosition === 'center-top'
                            ? `${config?.design?.position?.offsetY || 20}px`
                            : 'auto',
                          transform: effectivePosition === 'center-top' ? 'translateX(-50%)' : 'none',
                          pointerEvents: 'none',
                        }}
                  >
                    <div
                      className={`relative transition-all duration-300 ${
                        config?.design?.layout?.layout === 'full-width' ? 'w-full' :
                        config?.design?.layout?.layout === 'compact' ? 'p-2' :
                        config?.design?.layout?.layout === 'minimal' ? 'p-3' :
                        'p-4'
                      }`}
                      style={{
                        maxWidth: previewDevice === 'mobile' && config?.display?.responsive?.mobileMaxWidth
                          ? `${config.display.responsive.mobileMaxWidth}px`
                          : config?.design?.layout?.layout === 'full-width' ? '100%' : `${config?.design?.layout?.maxWidth || 280}px`,
                        minWidth: config?.design?.layout?.layout === 'full-width' ? '100%' : `${config?.design?.layout?.minWidth || 240}px`,
                        borderRadius: `${config?.design?.border?.borderRadius || 12}px`,
                        borderWidth: `${config?.design?.border?.borderWidth || 1}px`,
                        borderColor: config?.design?.shadow?.glassmorphism
                          ? 'rgba(255, 255, 255, 0.5)' // Brighter border for glass effect
                          : config?.design?.border?.borderColor || 'rgba(229, 231, 235, 1)',
                        borderLeftWidth: config?.design?.border?.borderLeftAccent
                          ? `${config?.design?.border?.borderLeftAccentWidth || 4}px`
                          : `${config?.design?.border?.borderWidth || 1}px`,
                        borderLeftColor: config?.design?.border?.borderLeftAccent
                          ? config?.design?.border?.borderLeftAccentColor || '#3B82F6'
                          : config?.design?.shadow?.glassmorphism
                            ? 'rgba(255, 255, 255, 0.3)'
                            : config?.design?.border?.borderColor || 'rgba(229, 231, 235, 1)',
                        boxShadow: config?.design?.shadow?.glassmorphism
                          ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 20px 27px rgba(0, 0, 0, 0.05)' // Glass effect with inner glow
                          : config?.design?.shadow?.shadowEnabled
                            ? getShadowStyle(config?.design?.shadow?.shadowSize || 'lg')
                            : 'none',
                        backgroundColor: config?.design?.shadow?.glassmorphism
                          ? 'rgba(255, 255, 255, 0.3)' // 30% opacity - highly transparent for glass effect
                          : config?.design?.background?.backgroundColor || 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: config?.design?.shadow?.glassmorphism
                          ? `blur(${blurAmount}px)`
                          : 'none',
                        WebkitBackdropFilter: config?.design?.shadow?.glassmorphism
                          ? `blur(${blurAmount}px)`
                          : 'none', // Safari support
                        cursor: isClickable ? 'pointer' : 'default',
                        overflow: 'hidden',
                      }}
                    >
                      {showCloseButton && (
                        <button
                          type="button"
                          className={`absolute ${closeButtonClass} text-gray-400 hover:text-gray-600 transition-colors`}
                          aria-label="Close"
                        >
                          ×
                        </button>
                      )}

                      {displaySettings.duration.progressBar && (
                        <div
                          className={`absolute ${progressBarPositionClass} left-0 right-0 h-1`}
                          style={{
                            backgroundColor: `${displaySettings.duration.progressBarColor}33`,
                            borderRadius: progressBarPositionClass === 'top-0' 
                              ? `${config?.design?.border?.borderRadius || 12}px ${config?.design?.border?.borderRadius || 12}px 0 0`
                              : `0 0 ${config?.design?.border?.borderRadius || 12}px ${config?.design?.border?.borderRadius || 12}px`,
                            overflow: 'hidden',
                            maxWidth: '100%'
                          }}
                        >
                          <div
                            className="h-full transition-all duration-700 ease-out"
                            style={{
                              width: '75%',
                              backgroundColor: displaySettings.duration.progressBarColor,
                              borderRadius: 'inherit'
                            }}
                          />
                        </div>
                      )}

                      <div className={`flex items-start ${
                        config?.design?.layout?.layout === 'compact' ? 'space-x-2' :
                        config?.design?.layout?.layout === 'minimal' ? 'space-x-2' :
                        'space-x-3'
                      }`}>
                        {(displaySettings.content.showEventIcon || !displaySettings.content.showUserAvatar) && (
                          <div className={`${
                            config?.design?.layout?.layout === 'compact' ? 'w-8 h-8 text-xs' :
                            config?.design?.layout?.layout === 'minimal' ? 'w-9 h-9 text-sm' :
                            'w-10 h-10'
                          } ${config?.design?.shadow?.glassmorphism ? 'bg-blue-600' : 'bg-blue-500'} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold shadow-md`}>
                            {displaySettings.content.showUserAvatar ? initials : '✨'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0" style={config?.design?.shadow?.glassmorphism ? { textShadow: '0 0 1px rgba(255, 255, 255, 0.5)' } : {}}>
                          <p className={`${
                            config?.design?.layout?.layout === 'compact' ? 'text-xs' :
                            config?.design?.layout?.layout === 'minimal' ? 'text-sm' :
                            'text-sm'
                          }`}>
                            <span className={`font-bold ${config?.design?.shadow?.glassmorphism ? 'text-blue-700' : 'text-blue-600'}`}>
                              {displaySettings.content.showCustomerName ? sampleName : 'Someone'}
                            </span>
                          </p>
                          <p className={`${
                            config?.design?.layout?.layout === 'compact' ? 'text-xs' :
                            config?.design?.layout?.layout === 'minimal' ? 'text-sm' :
                            'text-sm'
                          } ${config?.design?.shadow?.glassmorphism ? 'text-gray-900 font-medium' : 'text-gray-700'} ${displaySettings.content.showCustomerName ? 'mt-0.5' : ''}`}>
                            {sampleEvent}
                            {valueText && (
                              <span className={`ml-2 font-bold ${config?.design?.shadow?.glassmorphism ? 'text-gray-950' : 'text-gray-900'}`}>{valueText}</span>
                            )}
                          </p>
                          
                          {/* Rating Stars for Reviews */}
                          {displaySettings.content.showRating && sampleRating && (
                            <div className="flex items-center mt-1 space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`${i < sampleRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Review Content */}
                          {displaySettings.content.showReviewContent && sampleReviewContent && (
                            <p className={`${
                              config?.design?.layout?.layout === 'compact' ? 'text-xs' :
                              'text-xs'
                            } ${config?.design?.shadow?.glassmorphism ? 'text-gray-700' : 'text-gray-600'} mt-2 italic line-clamp-2`}>
                              "{sampleReviewContent}"
                            </p>
                          )}
                          
                          {metaLine && (
                            <div className={`flex items-center space-x-2 mt-2 text-xs ${config?.design?.shadow?.glassmorphism ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span>{metaLine}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`mt-3 pt-3 flex items-center justify-between text-[11px] ${
                        config?.design?.shadow?.glassmorphism 
                          ? 'border-t border-gray-300 text-gray-600 font-medium' 
                          : 'border-t border-gray-100 text-gray-400'
                      }`}>
                        <span>Verified by ProofPop</span>
                        {displaySettings.interaction.clickable && displaySettings.interaction.clickAction !== 'none' && (
                          <span className={`font-semibold ${config?.design?.shadow?.glassmorphism ? 'text-blue-700' : 'text-blue-500'}`}>
                            {displaySettings.interaction.clickAction === 'url' ? 'Opens link' : 'Interactive'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                      );
                    })()}

                  {/* Device Frame Decoration */}
                  {previewDevice === 'mobile' && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gray-300 rounded-full" />
                  )}
                </div>
              </div>

              {/* Preview Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">Live Preview:</span> This shows how your widget will appear to visitors with sample data matching your widget type. 
                  Changes are reflected in real-time as you adjust settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dirty State Indicator */}
      {isDirty && (
        <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span>You have unsaved changes</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetConfig}
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 font-medium disabled:opacity-50"
            >
              Save Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Accordion Section Component
interface AccordionSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isExpanded, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

// CSS for animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.5s ease-out;
  }
  .animate-preview-slide {
    animation: slide-up 0.5s ease-out;
  }
  .animate-preview-fade {
    animation: fade-in 0.6s ease-out;
  }
  .animate-preview-bounce {
    animation: bounce-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .animate-preview-zoom {
    animation: zoom-in 0.4s ease-out;
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes bounce-in {
    0% { transform: translateY(20px); opacity: 0; }
    60% { transform: translateY(-10px); opacity: 1; }
    80% { transform: translateY(5px); }
    100% { transform: translateY(0); }
  }
  @keyframes zoom-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);
