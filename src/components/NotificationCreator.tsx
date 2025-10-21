import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  UserPlus, 
  Mail, 
  ShoppingBag, 
  Star, 
  Eye,
  Clock,
  Plus,
  Loader2
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  preview: {
    title: string;
    content: string;
    timestamp: string;
    verified?: boolean;
  };
  color: string;
  bgColor: string;
}

interface NotificationCreatorProps {
  onNotificationCreated?: (widgetId?: string) => void;
  userId?: string;
  selectedSiteId?: string;
}

export function NotificationCreator({ onNotificationCreated, userId, selectedSiteId }: NotificationCreatorProps) {
  // Using 'All Notifications' as the default category (no need for state since we're not changing it)
  const selectedCategory = 'All Notifications';
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define categories for future use
  // const categories = [
  //   'All Notifications',
  //   'Stream',
  //   'Counters', 
  //   'Informational',
  //   'Chats',
  //   'Popup & Collectors',
  //   'Feedback'
  // ];

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'live-visitors',
      title: 'Live Visitors',
      description: 'Show real-time website visitor activity to create urgency',
      icon: Users,
      category: 'Stream',
      preview: {
        title: '24 people',
        content: 'are viewing this page right now!',
        timestamp: 'Live',
        verified: true
      },
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'recent-signup',
      title: 'Recent Signup',
      description: 'Display recent user registrations to show popularity',
      icon: UserPlus,
      category: 'Stream',
      preview: {
        title: 'Sarah from New York',
        content: 'just signed up for our service',
        timestamp: '2 mins ago',
        verified: true
      },
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'newsletter-subscriber',
      title: 'Newsletter Subscriber',
      description: 'Show newsletter subscription alerts to encourage signups',
      icon: Mail,
      category: 'Stream',
      preview: {
        title: '15 people',
        content: 'subscribed to our newsletter in the last 30 minutes',
        timestamp: 'Just now',
        verified: true
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'product-purchased',
      title: 'Recent Purchase',
      description: 'Display recent purchase notifications to build trust',
      icon: ShoppingBag,
      category: 'Stream',
      preview: {
        title: 'Mike from London',
        content: 'purchased Nike Air Force 1',
        timestamp: '10 mins ago',
        verified: true
      },
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'customer-reviews',
      title: 'Customer Reviews',
      description: 'Show new product/service reviews with ratings',
      icon: Star,
      category: 'Stream',
      preview: {
        title: 'David',
        content: 'The easiest way to get trust for your visitors is to show how many people have purchased your products.',
        timestamp: '5 mins ago',
        verified: true
      },
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'page-views',
      title: 'Page Views Counter',
      description: 'Display total page views to show popularity',
      icon: Eye,
      category: 'Counters',
      preview: {
        title: '1,247 views',
        content: 'in the last 24 hours',
        timestamp: 'Live',
        verified: false
      },
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'page-views-daily',
      title: 'Page Views Counter',
      description: 'Display total page views to show popularity',
      icon: Eye,
      category: 'Counters',
      preview: {
        title: '1,247 views',
        content: 'in the last 24 hours',
        timestamp: 'Live',
        verified: false
      },
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const filteredTemplates = selectedCategory === 'All Notifications' 
    ? notificationTemplates 
    : notificationTemplates.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = async (templateId: string) => {
    console.log('Creating widget with template:', templateId);
    console.log('User ID:', userId);
    console.log('Site ID:', selectedSiteId);
    
    if (!userId || !selectedSiteId) {
      setError('User not authenticated or no site selected');
      return;
    }

    // Prevent multiple clicks while creating
    if (isCreating) {
      return;
    }
    setSelectedTemplate(templateId);
    setIsCreating(true);
    setError(null);

    try {
      const template = notificationTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create a widget record in the database
      const { data: widgetData, error: widgetError } = await supabase
        .from('widgets')
        .insert([{
          user_id: userId,
          name: template.title,
          // Use a valid enum value for the widget type
          // The enum likely has values like 'recent_purchase', 'signup', etc.
          type: 'recent_purchase', 
          config: {
            template_id: templateId,
            original_type: template.id, // Store the original template ID in config
            title: template.title,
            description: template.description,
            preview: template.preview,
            color: template.color,
            bgColor: template.bgColor,
            // Store site ID in the config object instead
            site_id: selectedSiteId
          },
          is_active: true
        }])
        .select('id, name')
        .single();

      if (widgetError) {
        console.error('Widget creation error:', widgetError);
        throw new Error(`Failed to create widget: ${widgetError.message || 'Unknown error'}`);
      }
      
      console.log('Widget created successfully:', widgetData);
      
      // Call the callback to refresh the notifications list
      if (onNotificationCreated && widgetData && widgetData.id) {
        // Pass the widget ID to the callback so we can redirect to edit page
        onNotificationCreated(widgetData.id);
      }
      
      // No need to redirect to widget edit page in a new tab
      // The onNotificationCreated callback will handle navigation to the edit page in the same tab

    } catch (error) {
      console.error('Error creating notification:', error);
      setError(error instanceof Error ? error.message : 'Failed to create notification');
    } finally {
      setIsCreating(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create a new notification</h1>
            <p className="text-gray-600 mt-1">Choose the widget you want to use and edit it for your site</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <span>Get Support</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 text-red-600">⚠️</div>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Templates Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
              >
                {/* Template Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${template.bgColor} flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${template.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${template.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${template.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <span className={`font-medium ${template.color}`}>
                            {template.preview.title}
                          </span>
                          <span className="text-gray-700 ml-1">
                            {template.preview.content}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {template.preview.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-6 pb-6">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTemplateSelect(template.id);
                    }}
                    disabled={isCreating && selectedTemplate === template.id}
                    className="w-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 group-hover:bg-blue-50 group-hover:text-blue-600">
                    {isCreating && selectedTemplate === template.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-medium">Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Create Widget</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try selecting a different category to see more templates.</p>
          </div>
        )}
      </div>
    </div>
  );
}