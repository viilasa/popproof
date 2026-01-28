// Notification Rule Templates
// Pre-configured templates for common notification types

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'social_proof' | 'engagement' | 'conversion' | 'activity';

  // Default rule configuration
  defaultRules: {
    eventTypes: string[];
    minValue?: number;
    timeWindowHours?: number;
    excludeTestEvents?: boolean;
    requireLocation?: boolean;
  };

  // Display configuration
  displayConfig: {
    displayDuration: number;
    showTimestamp: boolean;
    showLocation: boolean;
    anonymizeNames?: boolean;
  };

  // Message template
  messageTemplate: {
    titleTemplate: string; // e.g., "{customer_name}"
    messageTemplate: string; // e.g., "just purchased {product_name}"
    variables: string[]; // ["customer_name", "product_name", "value"]
  };

  // Preview data
  preview: {
    title: string;
    message: string;
    timestamp: string;
  };
}

export const notificationTemplates: NotificationTemplate[] = [
  // 1. Recent Purchase
  {
    id: 'recent_purchase',
    name: 'Recent Purchase',
    description: 'Show recent customer purchases to build trust and create urgency',
    icon: 'shopping-bag',
    category: 'conversion',
    defaultRules: {
      eventTypes: ['purchase'],
      minValue: 0,
      timeWindowHours: 168, // 7 days
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 8,
      showTimestamp: true,
      showLocation: true,
      anonymizeNames: false
    },
    messageTemplate: {
      titleTemplate: '{customer_name}',
      messageTemplate: 'purchased {product_name} {value_display}',
      variables: ['customer_name', 'product_name', 'value', 'location', 'timestamp']
    },
    preview: {
      title: 'John D.',
      message: 'purchased Premium Plan for $99',
      timestamp: '2 minutes ago'
    }
  },

  // 2. New Signup
  {
    id: 'new_signup',
    name: 'New Signup',
    description: 'Display recent signups to show growing community',
    icon: 'user-plus',
    category: 'social_proof',
    defaultRules: {
      eventTypes: ['signup'],
      timeWindowHours: 48, // 2 days
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 7,
      showTimestamp: true,
      showLocation: true,
      anonymizeNames: true
    },
    messageTemplate: {
      titleTemplate: '{customer_name}',
      messageTemplate: 'signed up {location_display}',
      variables: ['customer_name', 'location', 'timestamp']
    },
    preview: {
      title: 'Sarah M.',
      message: 'signed up from New York',
      timestamp: '5 minutes ago'
    }
  },

  // 3. Customer Reviews
  {
    id: 'customer_review',
    name: 'Customer Reviews',
    description: 'Show positive reviews and ratings to build credibility',
    icon: 'star',
    category: 'social_proof',
    defaultRules: {
      eventTypes: ['review'],
      minValue: 4, // 4+ stars only
      timeWindowHours: 720, // 30 days
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 10,
      showTimestamp: true,
      showLocation: false,
      anonymizeNames: false
    },
    messageTemplate: {
      titleTemplate: '{customer_name}',
      messageTemplate: 'left a {rating}-star review',
      variables: ['customer_name', 'rating', 'review_text', 'timestamp']
    },
    preview: {
      title: 'Mike R.',
      message: 'left a 5-star review',
      timestamp: '1 hour ago'
    }
  },

  // 4. Live Visitor Count
  {
    id: 'live_visitors',
    name: 'Live Visitor Count',
    description: 'Display real-time visitor count to create urgency',
    icon: 'users',
    category: 'activity',
    defaultRules: {
      eventTypes: ['visitor_active'],
      timeWindowHours: 0.083, // 5 minutes
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 30, // Stays longer
      showTimestamp: false,
      showLocation: false,
      anonymizeNames: false
    },
    messageTemplate: {
      titleTemplate: '{visitor_count} people',
      messageTemplate: 'are viewing this right now',
      variables: ['visitor_count']
    },
    preview: {
      title: '24 people',
      message: 'are viewing this right now',
      timestamp: ''
    }
  },

  // 5. Form Submissions
  {
    id: 'form_submission',
    name: 'Form Submission',
    description: 'Show recent form submissions (contact, newsletter, etc.)',
    icon: 'file-text',
    category: 'engagement',
    defaultRules: {
      eventTypes: ['form_submit'],
      timeWindowHours: 24, // 1 day
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 7,
      showTimestamp: true,
      showLocation: true,
      anonymizeNames: true
    },
    messageTemplate: {
      titleTemplate: '{customer_name}',
      messageTemplate: 'submitted {form_type}',
      variables: ['customer_name', 'form_type', 'location', 'timestamp']
    },
    preview: {
      title: 'Emma W.',
      message: 'submitted contact form',
      timestamp: '10 minutes ago'
    }
  },

  // 6. Cart Activity
  {
    id: 'cart_activity',
    name: 'Cart Activity',
    description: 'Show when items are added to cart to create FOMO',
    icon: 'shopping-cart',
    category: 'conversion',
    defaultRules: {
      eventTypes: ['add_to_cart'],
      timeWindowHours: 2, // 2 hours
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 6,
      showTimestamp: true,
      showLocation: false,
      anonymizeNames: true
    },
    messageTemplate: {
      titleTemplate: '{customer_name}',
      messageTemplate: 'added {product_name} to cart',
      variables: ['customer_name', 'product_name', 'timestamp']
    },
    preview: {
      title: 'Someone',
      message: 'added Premium Plan to cart',
      timestamp: '3 minutes ago'
    }
  },

  // 7. Active Sessions
  {
    id: 'active_sessions',
    name: 'Active Sessions',
    description: 'Show current active browsing sessions',
    icon: 'activity',
    category: 'activity',
    defaultRules: {
      eventTypes: ['page_view'],
      timeWindowHours: 0.0083, // 30 seconds
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 20,
      showTimestamp: false,
      showLocation: false,
      anonymizeNames: false
    },
    messageTemplate: {
      titleTemplate: '{session_count} active sessions',
      messageTemplate: 'on this page',
      variables: ['session_count']
    },
    preview: {
      title: '8 active sessions',
      message: 'on this page',
      timestamp: ''
    }
  },

  // 8. Recent Activity
  {
    id: 'recent_activity',
    name: 'Recent Activity',
    description: 'General activity feed showing all events',
    icon: 'bell',
    category: 'activity',
    defaultRules: {
      eventTypes: ['purchase', 'signup', 'form_submit', 'review'],
      timeWindowHours: 48,
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 8,
      showTimestamp: true,
      showLocation: true,
      anonymizeNames: false
    },
    messageTemplate: {
      titleTemplate: '{customer_name}',
      messageTemplate: '{activity_message}',
      variables: ['customer_name', 'activity_message', 'timestamp']
    },
    preview: {
      title: 'Recent Activity',
      message: 'See what others are doing',
      timestamp: 'Live'
    }
  },

  // 9. Pill Badge - Daily Stats
  {
    id: 'pill_badge',
    name: 'Pill Badge',
    description: 'Compact pill showing today\'s activity stats (visitors, purchases, reviews)',
    icon: 'badge',
    category: 'activity',
    defaultRules: {
      eventTypes: ['page_view'],
      timeWindowHours: 24, // Today only
      excludeTestEvents: true,
      requireLocation: false
    },
    displayConfig: {
      displayDuration: 8, // 8 seconds like other widgets
      showTimestamp: false,
      showLocation: false,
      anonymizeNames: false
    },
    messageTemplate: {
      titleTemplate: '20',
      messageTemplate: 'visited today',
      variables: []
    },
    preview: {
      title: '20',
      message: 'visited today',
      timestamp: ''
    }
  }
];

// Helper function to get template by ID
export function getTemplateById(templateId: string): NotificationTemplate | undefined {
  return notificationTemplates.find(t => t.id === templateId);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): NotificationTemplate[] {
  return notificationTemplates.filter(t => t.category === category);
}

// Helper function to format message from template
export function formatNotificationMessage(
  template: NotificationTemplate,
  eventData: Record<string, any>
): { title: string; message: string } {
  let title = template.messageTemplate.titleTemplate;
  let message = template.messageTemplate.messageTemplate;

  // Replace variables in title
  template.messageTemplate.variables.forEach(variable => {
    const value = eventData[variable] || '';
    const placeholder = `{${variable}}`;

    // Special formatting for certain variables
    if (variable === 'value' && eventData.value) {
      const formattedValue = `for ${eventData.currency || '$'}${eventData.value}`;
      title = title.replace('{value_display}', formattedValue);
      message = message.replace('{value_display}', formattedValue);
    } else if (variable === 'location' && eventData.location) {
      const formattedLocation = `from ${eventData.location}`;
      message = message.replace('{location_display}', formattedLocation);
    } else {
      title = title.replace(placeholder, String(value));
      message = message.replace(placeholder, String(value));
    }
  });

  // Clean up any remaining placeholders
  title = title.replace(/\{[^}]+\}/g, '');
  message = message.replace(/\{[^}]+\}/g, '').trim();

  return { title, message };
}

// Export categories for filtering
export const notificationCategories = [
  { id: 'all', name: 'All Templates', icon: 'grid' },
  { id: 'conversion', name: 'Conversions', icon: 'trending-up' },
  { id: 'social_proof', name: 'Social Proof', icon: 'users' },
  { id: 'engagement', name: 'Engagement', icon: 'message-circle' },
  { id: 'activity', name: 'Activity', icon: 'activity' }
];
