import type {
  WidgetConfig,
  DesignSettings,
  TriggerSettings,
  DisplaySettings,
  BrandingSettings,
  WebhookSettings,
  AutoCaptureSettings,
  EcommerceSettings,
  APIIntegrationSettings,
  AnalyticsTrackingSettings,
} from '../types/widget-config';

// ==================== DESIGN DEFAULTS ====================

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  position: {
    position: 'bottom-left',
    offsetX: 20,
    offsetY: 20,
    stackDirection: 'vertical',
  },
  layout: {
    layout: 'card',
    maxWidth: 280,
    minWidth: 240,
  },
  border: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderStyle: 'solid',
    borderLeftAccent: true,
    borderLeftAccentWidth: 4,
    borderLeftAccentColor: '#3B82F6',
  },
  shadow: {
    shadowEnabled: true,
    shadowSize: 'lg',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    backdropBlur: 16,
    glassmorphism: true,
  },
  background: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backgroundGradient: false,
    gradientStart: '#ffffff',
    gradientEnd: '#f3f4f6',
    gradientDirection: 'to-br',
  },
  typography: {
    title: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      color: '#1F2937',
      letterSpacing: 0,
    },
    message: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 13,
      fontWeight: 400,
      color: '#6B7280',
      lineHeight: 1.4,
    },
    meta: {
      fontSize: 11,
      color: '#9CA3AF',
    },
  },
  icon: {
    iconEnabled: true,
    iconType: 'emoji',
    iconValue: '✓',
    iconSize: 24,
    iconBackgroundColor: '#3B82F6',
    iconBackgroundGradient: true,
    iconShape: 'circle',
    iconBorderColor: 'transparent',
    iconBorderWidth: 0,
  },
};

// ==================== TRIGGERS DEFAULTS ====================

export const DEFAULT_TRIGGER_SETTINGS: TriggerSettings = {
  events: {
    eventTypes: ['purchase', 'signup'],
    eventPriority: {
      purchase: 10,
      signup: 8,
      review: 7,
      form_submit: 6,
    },
    minValue: 0,
    maxValue: undefined,
    requiredFields: [],
    excludeFields: [],
    customFilters: [],
  },
  time: {
    timeWindowHours: 168, // 7 days
    showOnlyRecent: true,
    recentThresholdMinutes: 60,
    excludeOldEvents: false,
    oldEventThresholdDays: 30,
    timezone: 'UTC',
  },
  behavior: {
    showAfterDelay: 3,
    delayBetweenNotifications: 5, // seconds between notifications (default 5s)
    showAfterScroll: 0,
    showOnExitIntent: false,
    showOnInactivity: 0,
    showAfterPageViews: 0,
    hideAfterInteraction: false,
    hideAfterClicks: 0,
    hideOnScroll: false,
    hideOnFormSubmit: false,
  },
  frequency: {
    maxNotificationsPerSession: 3,
    maxNotificationsPerMinute: 1,
    minTimeBetweenNotifications: 5,
    respectDoNotDisturb: false,
    dndStartHour: 22,
    dndEndHour: 8,
  },
  advanced: {
    excludeTestEvents: true,
    requireLocation: false,
    allowedCountries: [],
    blockedCountries: [],
    deviceFilter: 'all',
    browserFilter: [],
    urlPatterns: {
      include: [],
      exclude: [],
    },
    customJsCondition: undefined,
  },
};

// ==================== DISPLAY DEFAULTS ====================

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  duration: {
    displayDuration: 8,
    fadeInDuration: 3000,
    fadeOutDuration: 3000,
    animationType: 'slide',
    progressBar: true,
    progressBarColor: '#3B82F6',
    progressBarPosition: 'top',
  },
  content: {
    showTimestamp: true,
    timestampFormat: 'relative',
    timestampPrefix: '• ',
    showLocation: true,
    locationFormat: 'city',
    showUserAvatar: false,
    showEventIcon: true,
    showValue: true,
    valueFormat: 'currency',
    currency: 'USD',
    currencyPosition: 'before',
    notificationTimeRange: 168, // 7 days default
    customTimeRangeHours: undefined,
    showCustomerName: true,
    showRating: true,
    showReviewContent: true,
  },
  privacy: {
    anonymizeNames: false,
    anonymizationStyle: 'first-initial',
    hideEmails: true,
    hidePhoneNumbers: true,
    maskIpAddresses: true,
    gdprCompliant: true,
  },
  interaction: {
    clickable: false,
    clickAction: 'none',
    clickUrl: undefined,
    clickUrlTarget: '_blank',
    closeButton: false,
    closeButtonPosition: 'top-right',
    pauseOnHover: true,
    expandOnHover: false,
  },
  responsive: {
    mobilePosition: undefined,
    mobileMaxWidth: undefined,
    hideOnMobile: false,
    hideOnDesktop: false,
    stackOnMobile: true,
    reducedMotionSupport: true,
  },
};

// ==================== BRANDING DEFAULTS ====================

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  identity: {
    showBrandLogo: false,
    brandLogoUrl: undefined,
    brandLogoPosition: 'left',
    brandLogoSize: 24,
    brandName: undefined,
    showPoweredBy: true,
    customPoweredByText: undefined,
  },
  colorScheme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#8B5CF6',
    textColorPrimary: '#1F2937',
    textColorSecondary: '#6B7280',
    linkColor: '#3B82F6',
    useColorScheme: 'light',
  },
  templates: {
    titleTemplate: '{customer_name}',
    messageTemplate: 'just performed an action',
    customVariables: {},
    variableFormatters: {},
    templatesByEventType: {
      purchase: {
        title: '{customer_name}',
        message: 'purchased {product_name}',
      },
      signup: {
        title: '{customer_name}',
        message: 'just signed up',
      },
      review: {
        title: '{customer_name}',
        message: 'left a {rating}-star review',
      },
    },
  },
  customCSS: {
    customCSS: '',
    customContainerClass: undefined,
    customNotificationClass: undefined,
    cssVariables: {},
  },
  localization: {
    language: 'en',
    autoDetectLanguage: true,
    translations: {
      en: {
        timestamp_just_now: 'just now',
        timestamp_minutes_ago: '{minutes}m ago',
        timestamp_hours_ago: '{hours}h ago',
        timestamp_days_ago: '{days}d ago',
        location_from: 'from',
      },
    },
    dateLocale: 'en-US',
    numberLocale: 'en-US',
  },
  sound: {
    soundEnabled: false,
    soundUrl: undefined,
    soundVolume: 0.5,
    vibrationEnabled: false,
    vibrationPattern: [200],
  },
};

// ==================== WEBHOOKS DEFAULTS ====================

export const DEFAULT_WEBHOOK_SETTINGS: WebhookSettings = {
  webhooks: [],
  payload: {
    webhookPayloadFormat: 'json',
    includeRawEvent: true,
    customPayloadTemplate: undefined,
    signRequests: false,
  },
  webhookUrl: 'https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event',
  autoCapture: {
    enabled: true,
    exactMatch: '',
    fullUrl: '',
  },
  widgetVersion: 'webhook',
};

// ==================== AUTO-CAPTURE DEFAULTS ====================

export const DEFAULT_AUTOCAPTURE_SETTINGS: AutoCaptureSettings = {
  forms: {
    autoCaptureForms: false,
    formSelectors: ['form[data-proof-track]'],
    captureFormFields: ['email', 'name', 'phone'],
    excludeFormFields: ['password', 'credit_card', 'ssn'],
    formSubmitEvent: 'form_submit',
    validateBeforeCapture: true,
  },
  clicks: {
    autoCaptureClicks: false,
    clickSelectors: ['[data-proof-event]', '[data-proof-purchase]'],
    clickEventType: 'click',
    captureClickData: ['data-product-id', 'data-product-name', 'data-value'],
  },
  pageEvents: {
    capturePageViews: true,
    captureScrollDepth: false,
    scrollDepthThresholds: [25, 50, 75, 100],
    captureTimeOnPage: false,
    timeThresholds: [30, 60, 120, 300],
  },
};

// ==================== ECOMMERCE DEFAULTS ====================

export const DEFAULT_ECOMMERCE_SETTINGS: EcommerceSettings = {
  autoDetectPlatform: true,
  platform: 'none',
  platformConfig: {},
  trackProductViews: true,
  productViewSelector: '[data-product-id]',
  productDataAttributes: {
    id: 'data-product-id',
    name: 'data-product-name',
    price: 'data-product-price',
    category: 'data-product-category',
    image: 'data-product-image',
  },
  trackAddToCart: true,
  addToCartSelector: '.add-to-cart, [data-add-to-cart]',
  trackCheckout: true,
  trackPurchase: true,
  purchaseConfirmationSelector: '.order-confirmation, [data-order-confirmation]',
};

// ==================== INTEGRATIONS DEFAULTS ====================

export const DEFAULT_INTEGRATION_SETTINGS: APIIntegrationSettings = {
  integrations: [],
  bidirectionalSync: false,
  syncDirection: 'push',
  syncFields: [],
  syncSchedule: undefined,
};

// ==================== ANALYTICS DEFAULTS ====================

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsTrackingSettings = {
  googleAnalyticsEnabled: false,
  googleAnalyticsId: undefined,
  facebookPixelEnabled: false,
  facebookPixelId: undefined,
  customTracking: [],
  trackNotificationViews: true,
  trackNotificationClicks: true,
  trackNotificationDismisses: true,
  sendToAnalytics: false,
  customDimensions: {},
};

// ==================== COMPLETE DEFAULT CONFIG ====================

export const DEFAULT_WIDGET_CONFIG: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'New Widget',
  type: 'notification',
  isActive: true,
  version: 1,
  design: DEFAULT_DESIGN_SETTINGS,
  triggers: DEFAULT_TRIGGER_SETTINGS,
  display: DEFAULT_DISPLAY_SETTINGS,
  branding: DEFAULT_BRANDING_SETTINGS,
  webhooks: DEFAULT_WEBHOOK_SETTINGS,
  autoCapture: DEFAULT_AUTOCAPTURE_SETTINGS,
  ecommerce: DEFAULT_ECOMMERCE_SETTINGS,
  integrations: DEFAULT_INTEGRATION_SETTINGS,
  analytics: DEFAULT_ANALYTICS_SETTINGS,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Merges user config with defaults (deep merge)
 */
export function mergeWithDefaults(userConfig: Partial<WidgetConfig>): WidgetConfig {
  const now = new Date().toISOString();
  
  return {
    id: userConfig.id || '',
    name: userConfig.name || DEFAULT_WIDGET_CONFIG.name,
    type: userConfig.type || DEFAULT_WIDGET_CONFIG.type,
    isActive: userConfig.isActive ?? DEFAULT_WIDGET_CONFIG.isActive,
    version: userConfig.version || DEFAULT_WIDGET_CONFIG.version,
    design: deepMerge(DEFAULT_DESIGN_SETTINGS, userConfig.design || {}),
    triggers: deepMerge(DEFAULT_TRIGGER_SETTINGS, userConfig.triggers || {}),
    display: deepMerge(DEFAULT_DISPLAY_SETTINGS, userConfig.display || {}),
    branding: deepMerge(DEFAULT_BRANDING_SETTINGS, userConfig.branding || {}),
    webhooks: deepMerge(DEFAULT_WEBHOOK_SETTINGS, userConfig.webhooks || {}),
    autoCapture: deepMerge(DEFAULT_AUTOCAPTURE_SETTINGS, userConfig.autoCapture || {}),
    ecommerce: deepMerge(DEFAULT_ECOMMERCE_SETTINGS, userConfig.ecommerce || {}),
    integrations: deepMerge(DEFAULT_INTEGRATION_SETTINGS, userConfig.integrations || {}),
    analytics: deepMerge(DEFAULT_ANALYTICS_SETTINGS, userConfig.analytics || {}),
    createdAt: userConfig.createdAt || now,
    updatedAt: userConfig.updatedAt || now,
  };
}

/**
 * Deep merge utility function
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output: Record<string, any> = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output as T;
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Get default config for a specific category
 */
export function getDefaultsForCategory(category: keyof Omit<WidgetConfig, 'id' | 'name' | 'type' | 'isActive' | 'createdAt' | 'updatedAt' | 'version'>) {
  const defaults = {
    design: DEFAULT_DESIGN_SETTINGS,
    triggers: DEFAULT_TRIGGER_SETTINGS,
    display: DEFAULT_DISPLAY_SETTINGS,
    branding: DEFAULT_BRANDING_SETTINGS,
    webhooks: DEFAULT_WEBHOOK_SETTINGS,
    autoCapture: DEFAULT_AUTOCAPTURE_SETTINGS,
    ecommerce: DEFAULT_ECOMMERCE_SETTINGS,
    integrations: DEFAULT_INTEGRATION_SETTINGS,
    analytics: DEFAULT_ANALYTICS_SETTINGS,
  };
  
  return defaults[category];
}

/**
 * Reset a specific category to defaults
 */
export function resetCategoryToDefaults<K extends keyof Omit<WidgetConfig, 'id' | 'name' | 'type' | 'isActive' | 'createdAt' | 'updatedAt' | 'version'>>(
  config: WidgetConfig,
  category: K
): WidgetConfig {
  return {
    ...config,
    [category]: getDefaultsForCategory(category),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a new widget config from template
 */
export function createWidgetFromTemplate(
  templateName: 'minimal' | 'modern' | 'glassmorphic' | 'bold',
  baseConfig?: Partial<WidgetConfig>
): WidgetConfig {
  const base = mergeWithDefaults(baseConfig || {});
  
  switch (templateName) {
    case 'minimal':
      return {
        ...base,
        design: {
          ...base.design,
          border: {
            ...base.design.border,
            borderRadius: 8,
            borderWidth: 1,
            borderLeftAccent: false,
          },
          shadow: {
            ...base.design.shadow,
            shadowSize: 'sm',
            glassmorphism: false,
          },
        },
      };
      
    case 'glassmorphic':
      return {
        ...base,
        design: {
          ...base.design,
          border: {
            ...base.design.border,
            borderRadius: 16,
          },
          shadow: {
            ...base.design.shadow,
            shadowSize: 'xl',
            glassmorphism: true,
            backdropBlur: 20,
          },
          background: {
            ...base.design.background,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
          },
        },
      };
      
    case 'bold':
      return {
        ...base,
        design: {
          ...base.design,
          border: {
            ...base.design.border,
            borderRadius: 4,
            borderLeftAccentWidth: 6,
          },
          typography: {
            ...base.design.typography,
            title: {
              ...base.design.typography.title,
              fontWeight: 700,
              fontSize: 15,
            },
          },
        },
      };
      
    case 'modern':
    default:
      return base;
  }
}
