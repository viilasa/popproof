// Widget Configuration Type Definitions
// Comprehensive types for all widget settings across all categories

// ==================== DESIGN SETTINGS ====================

export interface PositionSettings {
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center-top';
  offsetX: number; // px from edge
  offsetY: number; // px from edge
  stackDirection: 'vertical' | 'horizontal';
}

export interface LayoutSettings {
  layout: 'card' | 'compact' | 'minimal' | 'full-width' | 'ripple' | 'parallax' | 'puzzle' | 'peekaboo' | 'floating-tag' | 'story-pop' | 'frosted-token' | 'pill-badge';
  maxWidth: number; // px
  minWidth: number; // px
}

export interface BorderSettings {
  borderRadius: number; // px
  borderWidth: number; // px
  borderColor: string; // hex/rgba
  borderStyle: 'solid' | 'dashed' | 'gradient';
  borderLeftAccent: boolean;
  borderLeftAccentWidth: number; // px
  borderLeftAccentColor: string;
}

export interface ShadowSettings {
  shadowEnabled: boolean;
  shadowSize: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadowColor: string; // rgba
  backdropBlur: number; // px
  glassmorphism: boolean;
}

export interface BackgroundSettings {
  backgroundColor: string; // rgba
  backgroundGradient: boolean;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: 'to-r' | 'to-br' | 'to-b' | 'to-bl';
}

export interface TypographySettings {
  title: {
    fontFamily: string;
    fontSize: number; // px
    fontWeight: 400 | 500 | 600 | 700 | 800;
    color: string;
    letterSpacing: number;
  };
  message: {
    fontFamily: string;
    fontSize: number; // px
    fontWeight: 400 | 500 | 600;
    color: string;
    lineHeight: number;
  };
  meta: {
    fontSize: number; // px
    color: string;
  };
}

export interface IconSettings {
  iconEnabled: boolean;
  iconType: 'emoji' | 'lucide' | 'image' | 'initials' | 'none';
  iconValue: string; // emoji char, icon name, or image URL
  iconSize: number; // px
  iconBackgroundColor: string;
  iconBackgroundGradient: boolean;
  iconShape: 'circle' | 'square' | 'rounded-square';
  iconBorderColor: string;
  iconBorderWidth: number;
}

export interface DesignSettings {
  position: PositionSettings;
  layout: LayoutSettings;
  border: BorderSettings;
  shadow: ShadowSettings;
  background: BackgroundSettings;
  typography: TypographySettings;
  icon: IconSettings;
}

// ==================== TRIGGERS SETTINGS ====================

export interface EventTriggerSettings {
  eventTypes: string[]; // e.g., ['purchase', 'signup', 'review']
  eventPriority: Record<string, number>; // 1-10 priority per event type
  minValue?: number; // minimum transaction value
  maxValue?: number; // maximum transaction value
  requiredFields: string[]; // fields that must exist
  excludeFields: string[]; // events with these fields are excluded
  customFilters: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals';
    value: any;
  }>;
}

export interface TimeTriggerSettings {
  timeWindowHours: number; // how far back to look for events
  showOnlyRecent: boolean;
  recentThresholdMinutes: number;
  excludeOldEvents: boolean;
  oldEventThresholdDays: number;
  timezone: string; // IANA timezone
}

export interface BehaviorTriggerSettings {
  showAfterDelay: number; // seconds - delay before showing first notification
  delayBetweenNotifications: number; // seconds - gap between notifications (e.g., 5s, 60s, 300s for 5min)
  showAfterScroll: number; // percentage (0 = disabled)
  showOnExitIntent: boolean;
  showOnInactivity: number; // seconds (0 = disabled)
  showAfterPageViews: number; // 0 = immediate
  hideAfterInteraction: boolean;
  hideAfterClicks: number; // 0 = never
  hideOnScroll: boolean;
  hideOnFormSubmit: boolean;
}

export interface FrequencySettings {
  displayFrequency?: 'all_time' | 'once_per_session' | 'once_per_day';
  maxNotificationsPerSession: number;
  maxNotificationsPerMinute: number;
  minTimeBetweenNotifications: number; // seconds
  respectDoNotDisturb: boolean;
  dndStartHour: number; // 24h format
  dndEndHour: number; // 24h format
}

export interface AdvancedRuleSettings {
  excludeTestEvents: boolean;
  requireLocation: boolean;
  allowedCountries: string[]; // ISO country codes (empty = all)
  blockedCountries: string[];
  deviceFilter: 'all' | 'mobile' | 'desktop' | 'tablet';
  browserFilter: string[]; // empty = all browsers
  urlPatterns: {
    include: string[]; // glob patterns
    exclude: string[]; // glob patterns
    matchTypes?: ('exact' | 'contains' | 'starts')[]; // match type per URL pattern
  };
  customJsCondition?: string; // advanced: JS expression
  // Product-specific filtering
  productSpecificMode: 'off' | 'product_only' | 'product_first'; // off = show all, product_only = only show events for current product, product_first = prioritize current product but fallback to general
}

export interface TriggerSettings {
  events: EventTriggerSettings;
  time: TimeTriggerSettings;
  behavior: BehaviorTriggerSettings;
  frequency: FrequencySettings;
  advanced: AdvancedRuleSettings;
}

// ==================== DISPLAY SETTINGS ====================

export interface DurationSettings {
  displayDuration: number; // seconds
  fadeInDuration: number; // ms
  fadeOutDuration: number; // ms
  animationType: 'slide' | 'fade' | 'bounce' | 'zoom' | 'none';
  progressBar: boolean;
  progressBarColor: string;
  progressBarPosition: 'top' | 'bottom';
}

export interface ContentDisplaySettings {
  showTimestamp: boolean;
  timestampFormat: 'relative' | 'absolute' | 'both';
  timestampPrefix: string; // e.g., "• "
  showLocation: boolean;
  locationFormat: 'city' | 'city-country' | 'country' | 'flag-emoji';
  showUserAvatar: boolean;
  showEventIcon: boolean;
  showValue: boolean;
  valueFormat: 'currency' | 'number' | 'text';
  currency: string; // e.g., 'USD'
  currencyPosition: 'before' | 'after';
  notificationTimeRange: number; // Hours to look back for notifications (1, 24, 48, 168, 720, or custom)
  customTimeRangeHours?: number; // Custom time range in hours if notificationTimeRange is 0
  showCustomerName: boolean; // Show customer/user name
  showRating: boolean; // Show rating stars (for reviews)
  showReviewContent: boolean; // Show review text content
  // Custom message template for form submissions
  useCustomFormMessage: boolean; // Toggle for custom form message
  customFormMessage: string; // e.g., "signed up for the challenge" - name is auto-prepended
}

export interface PrivacySettings {
  anonymizeNames: boolean;
  anonymizationStyle: 'first-initial' | 'first-last-initial' | 'random';
  hideEmails: boolean;
  hidePhoneNumbers: boolean;
  maskIpAddresses: boolean;
  gdprCompliant: boolean;
}

export interface InteractionSettings {
  clickable: boolean;
  clickAction: 'none' | 'url' | 'close' | 'custom';
  clickUrl?: string;
  clickUrlTarget: '_blank' | '_self';
  closeButton: boolean;
  closeButtonPosition: 'top-right' | 'top-left';
  pauseOnHover: boolean;
  expandOnHover: boolean;
}

export interface ResponsiveSettings {
  mobilePosition?: string; // can differ from desktop
  mobileMaxWidth?: number;
  hideOnMobile: boolean;
  hideOnDesktop: boolean;
  stackOnMobile: boolean;
  reducedMotionSupport: boolean;
}

export interface DisplaySettings {
  duration: DurationSettings;
  content: ContentDisplaySettings;
  privacy: PrivacySettings;
  interaction: InteractionSettings;
  responsive: ResponsiveSettings;
}

// ==================== BRANDING SETTINGS ====================

export interface BrandIdentitySettings {
  showBrandLogo: boolean;
  brandLogoUrl?: string;
  brandLogoPosition: 'top' | 'bottom' | 'left' | 'right';
  brandLogoSize: number; // px
  brandName?: string;
  showPoweredBy: boolean;
  customPoweredByText?: string;
}

export interface ColorSchemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColorPrimary: string;
  textColorSecondary: string;
  linkColor: string;
  useColorScheme: 'light' | 'dark' | 'auto';
}

export interface MessageTemplateSettings {
  titleTemplate: string; // supports {variables}
  messageTemplate: string;
  customVariables: Record<string, string>;
  variableFormatters: Record<string, string>; // stored as strings, evaluated at runtime
  templatesByEventType: Record<string, {
    title: string;
    message: string;
  }>;
}

export interface CustomCSSSettings {
  customCSS: string; // injected into widget
  customContainerClass?: string;
  customNotificationClass?: string;
  cssVariables: Record<string, string>;
}

export interface LocalizationSettings {
  language: string; // ISO language code
  autoDetectLanguage: boolean;
  translations: Record<string, {
    timestamp_just_now: string;
    timestamp_minutes_ago: string;
    timestamp_hours_ago: string;
    timestamp_days_ago: string;
    location_from: string;
    [key: string]: string;
  }>;
  dateLocale: string;
  numberLocale: string;
}

export interface SoundSettings {
  soundEnabled: boolean;
  soundUrl?: string;
  soundVolume: number; // 0-1
  vibrationEnabled: boolean; // mobile only
  vibrationPattern: number[]; // ms
}

export interface BrandingSettings {
  identity: BrandIdentitySettings;
  colorScheme: ColorSchemeSettings;
  templates: MessageTemplateSettings;
  customCSS: CustomCSSSettings;
  localization: LocalizationSettings;
  sound: SoundSettings;
}

// ==================== WEBHOOKS & AUTO-CAPTURE SETTINGS ====================

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET' | 'PUT';
  headers: Record<string, string>;
  events: string[]; // which events trigger this webhook
  enabled: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
  secret?: string; // for signing requests
}

export interface WebhookPayloadSettings {
  webhookPayloadFormat: 'json' | 'form-data' | 'custom';
  includeRawEvent: boolean;
  customPayloadTemplate?: string; // JSON template
  signRequests: boolean; // HMAC signing
}

export interface WebhookSettings {
  webhooks?: WebhookConfig[];
  payload?: WebhookPayloadSettings;
  webhookUrl?: string; // Primary webhook endpoint URL
  autoCapture?: {
    enabled: boolean;
    exactMatch?: string; // CSS selector for specific forms
    fullUrl?: string; // Only capture on specific page URL
  };
  widgetVersion?: 'webhook' | 'plugin'; // Integration method
}

export interface FormCaptureSettings {
  autoCaptureForms: boolean;
  formSelectors: string[]; // CSS selectors
  captureFormFields: string[]; // field names to capture
  excludeFormFields: string[]; // passwords, etc.
  formSubmitEvent: string; // custom event type name
  validateBeforeCapture: boolean;
}

export interface ClickTrackingSettings {
  autoCaptureClicks: boolean;
  clickSelectors: string[]; // e.g., ['.buy-button', '#cta']
  clickEventType: string; // default: 'click'
  captureClickData: string[]; // data attributes to capture
}

export interface PageEventSettings {
  capturePageViews: boolean;
  captureScrollDepth: boolean;
  scrollDepthThresholds: number[]; // %, e.g., [25, 50, 75, 100]
  captureTimeOnPage: boolean;
  timeThresholds: number[]; // seconds
}

export interface AutoCaptureSettings {
  forms: FormCaptureSettings;
  clicks: ClickTrackingSettings;
  pageEvents: PageEventSettings;
}

export interface EcommerceSettings {
  autoDetectPlatform: boolean;
  platform: 'shopify' | 'woocommerce' | 'custom' | 'none';
  platformConfig: Record<string, any>;
  trackProductViews: boolean;
  productViewSelector: string;
  productDataAttributes: {
    id: string;
    name: string;
    price: string;
    category: string;
    image: string;
  };
  trackAddToCart: boolean;
  addToCartSelector: string;
  trackCheckout: boolean;
  trackPurchase: boolean;
  purchaseConfirmationSelector: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'zapier' | 'make' | 'custom' | 'webhook';
  apiKey?: string;
  endpoint?: string;
  syncInterval?: number; // minutes
  enabled: boolean;
}

export interface APIIntegrationSettings {
  integrations: IntegrationConfig[];
  bidirectionalSync: boolean;
  syncDirection: 'push' | 'pull' | 'both';
  syncFields: string[];
  syncSchedule?: string; // cron expression
}

export interface AnalyticsTrackingSettings {
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId?: string;
  facebookPixelEnabled: boolean;
  facebookPixelId?: string;
  customTracking: Array<{
    platform: string;
    trackingId: string;
    events: string[];
  }>;
  trackNotificationViews: boolean;
  trackNotificationClicks: boolean;
  trackNotificationDismisses: boolean;
  sendToAnalytics: boolean;
  customDimensions: Record<string, string>;
}

// ==================== MAIN WIDGET CONFIG ====================

export interface WidgetConfig {
  // Core identification
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  
  // Main setting categories
  design: DesignSettings;
  triggers: TriggerSettings;
  display: DisplaySettings;
  branding: BrandingSettings;
  webhooks: WebhookSettings;
  autoCapture: AutoCaptureSettings;
  ecommerce: EcommerceSettings;
  integrations: APIIntegrationSettings;
  analytics: AnalyticsTrackingSettings;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number; // for config versioning
}

// Partial types for updates
export type PartialWidgetConfig = Partial<WidgetConfig>;
export type DeepPartialWidgetConfig = {
  [P in keyof WidgetConfig]?: WidgetConfig[P] extends object
    ? Partial<WidgetConfig[P]>
    : WidgetConfig[P];
};

// Helper type for widget config updates in the database
export interface WidgetConfigUpdate {
  name?: string;
  is_active?: boolean;
  config: Partial<{
    design: Partial<DesignSettings>;
    triggers: Partial<TriggerSettings>;
    display: Partial<DisplaySettings>;
    branding: Partial<BrandingSettings>;
    webhooks: Partial<WebhookSettings>;
    autoCapture: Partial<AutoCaptureSettings>;
    ecommerce: Partial<EcommerceSettings>;
    integrations: Partial<APIIntegrationSettings>;
    analytics: Partial<AnalyticsTrackingSettings>;
  }>;
}

// Type guards
export function isValidWidgetConfig(obj: any): obj is WidgetConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.isActive === 'boolean' &&
    obj.design &&
    obj.triggers &&
    obj.display &&
    obj.branding
  );
}

