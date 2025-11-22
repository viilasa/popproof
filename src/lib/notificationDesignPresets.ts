import type { DesignSettings, DisplaySettings } from '../types/widget-config';

export type NotificationTemplateId =
  | 'recent_purchase'
  | 'new_signup'
  | 'customer_review'
  | 'live_visitors'
  | 'form_submission'
  | 'cart_activity'
  | 'active_sessions'
  | 'recent_activity';

export interface NotificationDesignPreset {
  id: string;
  templateId: NotificationTemplateId;
  name: string;
  description: string;
  // Only overrides; full config is merged with defaults elsewhere
  design?: Partial<DesignSettings>;
  display?: Partial<DisplaySettings>;
}

export const notificationDesignPresets: NotificationDesignPreset[] = [
  // Recent Purchase
  {
    id: 'recent_purchase_classic_card',
    templateId: 'recent_purchase',
    name: 'Classic Card',
    description: 'Bottom-left glass card with blue accent border.',
    design: {
      position: { position: 'bottom-left', offsetX: 24, offsetY: 24, stackDirection: 'vertical' },
      layout: { layout: 'card', maxWidth: 320, minWidth: 260 },
      border: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.25)',
        borderStyle: 'solid',
        borderLeftAccent: true,
        borderLeftAccentWidth: 4,
        borderLeftAccentColor: '#3B82F6',
      },
      shadow: {
        shadowEnabled: true,
        shadowSize: 'lg',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        backdropBlur: 18,
        glassmorphism: true,
      },
      background: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backgroundGradient: false,
        gradientStart: '#ffffff',
        gradientEnd: '#f9fafb',
        gradientDirection: 'to-br',
      },
    },
    display: {
      duration: {
        displayDuration: 8,
        fadeInDuration: 300,
        fadeOutDuration: 300,
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
        notificationTimeRange: 168,
        showCustomerName: true,
        showRating: true,
        showReviewContent: true,
      },
    },
  },
  {
    id: 'recent_purchase_center_banner',
    templateId: 'recent_purchase',
    name: 'Center Top Banner',
    description: 'Wide center-top banner with bold gradient background.',
    design: {
      position: { position: 'center-top', offsetX: 0, offsetY: 16, stackDirection: 'vertical' },
      layout: { layout: 'full-width', maxWidth: 420, minWidth: 320 },
      border: {
        borderRadius: 999,
        borderWidth: 0,
        borderColor: 'transparent',
        borderStyle: 'solid',
        borderLeftAccent: false,
        borderLeftAccentWidth: 0,
        borderLeftAccentColor: '#3B82F6',
      },
      shadow: {
        shadowEnabled: true,
        shadowSize: 'xl',
        shadowColor: 'rgba(15, 23, 42, 0.35)',
        backdropBlur: 24,
        glassmorphism: true,
      },
      background: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        backgroundGradient: true,
        gradientStart: '#4f46e5',
        gradientEnd: '#0ea5e9',
        gradientDirection: 'to-r',
      },
    },
    display: {
      duration: {
        displayDuration: 9,
        fadeInDuration: 350,
        fadeOutDuration: 300,
        animationType: 'bounce',
        progressBar: true,
        progressBarColor: '#22c55e',
        progressBarPosition: 'bottom',
      },
      content: {
        showTimestamp: true,
        timestampFormat: 'relative',
        timestampPrefix: '',
        showLocation: true,
        locationFormat: 'city-country',
        showUserAvatar: false,
        showEventIcon: true,
        showValue: true,
        valueFormat: 'currency',
        currency: 'USD',
        currencyPosition: 'before',
        notificationTimeRange: 168,
        showCustomerName: true,
        showRating: true,
        showReviewContent: false,
      },
    },
  },

  // New Signup
  {
    id: 'new_signup_minimal_left',
    templateId: 'new_signup',
    name: 'Minimal Left',
    description: 'Clean minimal card with subtle border.',
    design: {
      position: { position: 'bottom-left', offsetX: 20, offsetY: 20, stackDirection: 'vertical' },
      layout: { layout: 'minimal', maxWidth: 300, minWidth: 250 },
      border: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.4)',
        borderStyle: 'solid',
        borderLeftAccent: false,
        borderLeftAccentWidth: 0,
        borderLeftAccentColor: '#6366F1',
      },
      shadow: {
        shadowEnabled: true,
        shadowSize: 'md',
        shadowColor: 'rgba(15, 23, 42, 0.18)',
        backdropBlur: 0,
        glassmorphism: false,
      },
      background: {
        backgroundColor: '#ffffff',
        backgroundGradient: false,
        gradientStart: '#ffffff',
        gradientEnd: '#ffffff',
        gradientDirection: 'to-br',
      },
    },
    display: {
      duration: {
        displayDuration: 7,
        fadeInDuration: 260,
        fadeOutDuration: 260,
        animationType: 'slide',
        progressBar: false,
        progressBarColor: '#6366F1',
        progressBarPosition: 'top',
      },
      content: {
        showTimestamp: true,
        timestampFormat: 'relative',
        timestampPrefix: '',
        showLocation: true,
        locationFormat: 'city',
        showUserAvatar: true,
        showEventIcon: false,
        showValue: false,
        valueFormat: 'currency',
        currency: 'USD',
        currencyPosition: 'before',
        notificationTimeRange: 48,
        showCustomerName: true,
        showRating: false,
        showReviewContent: false,
      },
    },
  },
  {
    id: 'new_signup_pill_top_right',
    templateId: 'new_signup',
    name: 'Pill Top Right',
    description: 'Rounded pill at top-right, ideal for showing signups.',
    design: {
      position: { position: 'top-right', offsetX: 20, offsetY: 20, stackDirection: 'vertical' },
      layout: { layout: 'compact', maxWidth: 320, minWidth: 260 },
      border: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.5)',
        borderStyle: 'solid',
        borderLeftAccent: false,
        borderLeftAccentWidth: 0,
        borderLeftAccentColor: '#3B82F6',
      },
      shadow: {
        shadowEnabled: true,
        shadowSize: 'lg',
        shadowColor: 'rgba(15, 23, 42, 0.25)',
        backdropBlur: 20,
        glassmorphism: true,
      },
      background: {
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backgroundGradient: true,
        gradientStart: '#0f172a',
        gradientEnd: '#1d4ed8',
        gradientDirection: 'to-br',
      },
    },
    display: {
      duration: {
        displayDuration: 7,
        fadeInDuration: 260,
        fadeOutDuration: 260,
        animationType: 'zoom',
        progressBar: true,
        progressBarColor: '#22c55e',
        progressBarPosition: 'bottom',
      },
      content: {
        showTimestamp: true,
        timestampFormat: 'relative',
        timestampPrefix: '• ',
        showLocation: true,
        locationFormat: 'city-country',
        showUserAvatar: true,
        showEventIcon: true,
        showValue: false,
        valueFormat: 'currency',
        currency: 'USD',
        currencyPosition: 'before',
        notificationTimeRange: 48,
        showCustomerName: true,
        showRating: false,
        showReviewContent: false,
      },
    },
  },
];
