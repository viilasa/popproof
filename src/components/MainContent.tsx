import { useState, useEffect } from 'react';
import { Search, Plus, Eye, EyeOff, Users, BarChart3, Edit3, Menu, Globe, Trash2, ShoppingBag, Bell, Code } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';
import { AddSiteModal } from './AddSiteModal';
import { PixelIntegration } from './PixelIntegration';
import { ConfirmationModal } from './ConfirmationModal';
import { WidgetEditorWithPreview } from './WidgetEditor/index';
import { supabase } from '../lib/supabase';
import Account from '../pages/Account';
import Analytics from '../pages/Analytics';

interface MainContentProps {
  activeSection: string;
  userId?: string;
  onSectionChange: (section: string) => void;
  initialWidgetId?: string | null;
}

interface Site {
  id: string;
  name: string;
  public_key: string;
  domain: string | null;
  is_active: boolean;
  created_at: string;
  usage_count: number;
  last_used: string | null;
  last_ping: string | null;
  verified: boolean;
}

interface Notification {
  id: string;
  site_id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  priority: number;
  views: number;
  conversions: number;
  ctr: number;
  createdAt: string;
  layout_style: string;
  preview: {
    icon: string;
    title: string;
    content: string;
    timestamp: string;
  };
}

export function MainContent({ activeSection, userId, onSectionChange, initialWidgetId }: MainContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [pixelStatus, setPixelStatus] = useState<'inactive' | 'active' | 'checking'>('inactive');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allWidgets, setAllWidgets] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false
  });

  // State for widget editing
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  
  // Load saved section and state on component mount
  useEffect(() => {
    const lastSection = localStorage.getItem('lastSection');
    const lastSiteId = localStorage.getItem('lastSiteId');
    const lastWidgetId = localStorage.getItem('lastWidgetId');
    
    // If initialWidgetId is provided, use it (from URL parameter)
    if (initialWidgetId) {
      setSelectedWidgetId(initialWidgetId);
    }
    // Otherwise use the stored widget ID if available
    else if (lastWidgetId) {
      setSelectedWidgetId(lastWidgetId);
    }
    
    if (lastSection && !initialWidgetId) {
      onSectionChange(lastSection);
    }
    
    if (lastSiteId) {
      setSelectedSiteId(lastSiteId);
    }
  }, [initialWidgetId, onSectionChange]);
  
  // Save current section and state when they change
  useEffect(() => {
    localStorage.setItem('lastSection', activeSection);
    if (selectedSiteId) {
      localStorage.setItem('lastSiteId', selectedSiteId);
    }
    if (selectedWidgetId) {
      localStorage.setItem('lastWidgetId', selectedWidgetId);
    } else {
      localStorage.removeItem('lastWidgetId');
    }
  }, [activeSection, selectedSiteId, selectedWidgetId]);
  
  useEffect(() => {
    if (activeSection === 'sites' && userId) {
      fetchSites();
    }
    if (userId) {
      fetchSites(); // Always fetch sites for the selector
    }
    if (activeSection === 'notifications' && userId) {
      fetchNotifications();
    }
  }, [activeSection, userId]);

  useEffect(() => {
    if (activeSection === 'notifications' && selectedSiteId) {
      fetchNotifications();
      fetchActiveVisitors(); // Initial fetch
    }
  }, [selectedSiteId]);

  // Poll active visitors every 10 seconds when on notifications page
  useEffect(() => {
    if (activeSection === 'notifications' && selectedSiteId) {
      fetchActiveVisitors(); // Initial fetch
      
      const interval = setInterval(() => {
        fetchActiveVisitors();
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [activeSection, selectedSiteId]);

  useEffect(() => {
    // Auto-select first site when sites are loaded
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites]);
  const fetchNotifications = async () => {
    if (!userId || !selectedSiteId) return;
    
    setNotificationsLoading(true);
    try {
      // Fetch widgets for the selected site
      const { data: widgets, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('site_id', selectedSiteId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched widgets for site:', widgets);

      const widgetNotifications: Notification[] = widgets?.map((widget, index) => ({
        id: widget.id,
        site_id: widget.site_id,
        name: widget.name || widget.config?.name || 'Unnamed Widget',
        type: widget.config?.template_id || widget.type || 'custom',
        status: widget.is_active ? 'active' : 'inactive',
        priority: index + 1,
        views: 0, // TODO: Real analytics from notification_analytics table
        conversions: 0,
        ctr: 0,
        createdAt: widget.created_at,
        layout_style: widget.layout_style || 'card',
        preview: {
          icon: widget.config?.template_id || 'bell',
          title: widget.config?.template_name || widget.name || 'Widget',
          content: `${widget.config?.template_name || widget.type} notification`,
          timestamp: new Date(widget.created_at).toLocaleDateString()
        }
      })) || [];

      setNotifications(widgetNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchActiveVisitors = async () => {
    if (!selectedSiteId) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-active-visitors?site_id=${selectedSiteId}&time_window=5`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActiveVisitors(data.visitor_count);
        }
      }
    } catch (error) {
      console.error('Error fetching active visitors:', error);
    }
  };

  const fetchSites = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched sites:', data);
      setSites(data || []);

      // Also fetch all widgets to calculate counts
      console.log('Fetching all widgets for counts...');
      const { data: allWidgetsData, error: widgetsError } = await supabase
        .from('widgets')
        .select('id, config')
        .eq('user_id', userId);

      if (widgetsError) {
        console.error('Error fetching widgets for counts:', widgetsError);
        throw widgetsError;
      }
      console.log('Fetched all widgets:', allWidgetsData);
      setAllWidgets(allWidgetsData || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSite = async (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    console.log('Delete site clicked:', siteId, site);
    
    // Save current section and state to localStorage for page reload persistence
    localStorage.setItem('lastSection', activeSection);
    localStorage.setItem('lastSiteId', selectedSiteId);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Site',
      message: `Are you sure you want to delete "${site?.name || 'this site'}"? This will permanently remove all associated data and cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        
        try {
          const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', siteId);

          if (error) throw error;
          fetchSites();
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, loading: false });
        } catch (error) {
          console.error('Error deleting site:', error);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
      loading: false
    });
  };

  const closeConfirmModal = () => {
    if (!confirmModal.loading) {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, loading: false });
    }
  };

  const toggleSiteStatus = async (siteId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', siteId);

      if (error) throw error;
      fetchSites();
    } catch (error) {
      console.error('Error updating site status:', error);
    }
  };

  const handlePixelIntegration = (site: Site) => {
    setSelectedSite(site);
    onSectionChange('pixel-integration');
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const verifyPixel = async () => {
    if (!selectedSite) return;
    
    setPixelStatus('checking');
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-events?client_id=${selectedSite.public_key}&limit=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPixelStatus(data.events && data.events.length > 0 ? 'active' : 'inactive');
      } else {
        setPixelStatus('inactive');
      }
    } catch (error) {
      console.error('Pixel verification failed:', error);
      setPixelStatus('inactive');
    }
  };

  const toggleNotificationStatus = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;

      const newStatus = notification.status === 'active' ? false : true;
      
      const { error } = await supabase
        .from('widgets')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === id 
          ? { ...notification, status: newStatus ? 'active' : 'inactive' }
          : notification
      ));
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  };

  const editWidget = (id: string) => {
    // Save the widget ID and navigate to edit page
    setSelectedWidgetId(id);
    onSectionChange('edit-widget');
  };
  
  const deleteNotification = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Notification',
      message: `Are you sure you want to delete "${notification?.name || 'this notification'}"? This action cannot be undone and will permanently remove the notification from your site.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        
        try {
          const { error } = await supabase
            .from('widgets')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update local state
          setNotifications(prev => prev.filter(notification => notification.id !== id));
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, loading: false });
        } catch (error) {
          console.error('Error deleting notification:', error);
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      },
      loading: false
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase':
      case 'recent-purchase':
      case 'product-purchased':
        return ShoppingBag;
      case 'visitors':
      case 'live-visitors':
        return Users;
      case 'signup':
      case 'recent-signup':
      case 'newsletter-subscriber':
        return Bell;
      default:
        return Bell;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate pixel code
  const baseUrl = window.location.origin;
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  const pixelCode = selectedSite ? `<!-- Pixel Code for ${selectedSite.domain || selectedSite.name} -->
<script async src="${baseUrl}/widget.js" data-client-id="${selectedSite.public_key}" data-api-url="${apiUrl}"></script>
<!-- END Pixel Code -->` : '';

  if (activeSection === 'create-notification') {
    return (
      <TemplateSelector 
        onTemplateSelected={(widgetId: string) => {
          // Open the newly created widget in the enhanced editor immediately
          console.log('Opening newly created widget in enhanced editor:', widgetId);
          setSelectedWidgetId(widgetId);
          localStorage.setItem('lastWidgetId', widgetId);
          onSectionChange('edit-widget');
        }}
        onBack={() => onSectionChange('notifications')}
        userId={userId}
        selectedSiteId={selectedSiteId}
      />
    );
  }

  if (activeSection === 'notifications') {
    return (
      <div className="flex-1 bg-gray-50 min-h-full">
        {/* Header with Site Selector */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            {/* Left side - Site selector */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowSiteDropdown(!showSiteDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors min-w-[200px]"
                >
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {sites.find(s => s.id === selectedSiteId)?.domain || 
                     sites.find(s => s.id === selectedSiteId)?.name || 
                     'Select a site'}
                  </span>
                  <div className="flex items-center space-x-1 ml-auto">
                    {selectedSiteId && (
                      <div className={`w-2 h-2 rounded-full ${
                        sites.find(s => s.id === selectedSiteId)?.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {showSiteDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {sites.length > 0 ? (
                        sites.map((site) => (
                          <button
                            key={site.id}
                            onClick={() => {
                              setSelectedSiteId(site.id);
                              setShowSiteDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              selectedSiteId === site.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="truncate">{site.domain || site.name}</span>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full ${site.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-xs text-gray-500">
                                {site.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No sites available
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={() => {
                          setShowSiteDropdown(false);
                          onSectionChange('sites');
                        }}
                        className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add new site</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span>Notifications</span>
              </div>
            </div>
            
            {/* Right side - Search and New Notification Button */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 lg:w-64 text-sm"
                />
              </div>
              <button 
                onClick={() => onSectionChange('create-notification')}
                disabled={!selectedSiteId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Notification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.filter(n => n.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 bg-green-600 rounded-lg ${activeVisitors > 0 ? 'animate-pulse' : ''}`}>
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Visitors</p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-gray-900">{activeVisitors}</p>
                    <span className="text-sm text-gray-500">right now</span>
                  </div>
                  {activeVisitors > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.reduce((sum, n) => sum + n.conversions, 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">CTR</p>
                  <p className="text-2xl font-bold text-gray-900">{(notifications.reduce((sum, n) => sum + n.ctr, 0) / notifications.length).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="px-4 sm:px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Notification</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Preview</div>
                <div className="col-span-2">Performance</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Notifications List */}
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading notifications...</p>
                </div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.preview.icon);
                return (
                  <div 
                    key={notification.id} 
                    onClick={() => editWidget(notification.id)}
                    className="border-b border-gray-200 px-6 py-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{notification.name}</h3>
                            <p className="text-sm text-gray-500">{formatDate(notification.createdAt)}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNotificationStatus(notification.id);
                          }}
                          className={`w-11 h-6 rounded-full relative transition-colors ${
                            notification.status === 'active' ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                            notification.status === 'active' ? 'right-0.5' : 'left-0.5'
                          }`}></div>
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        {/* Frosted Token Preview */}
                        {notification.layout_style === 'frosted-token' ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gray-800">
                            <div className="px-1.5 py-0.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white">
                              <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                                <span className="font-bold text-[7px]">32</span>
                                <span className="text-[6px] opacity-80">bought</span>
                              </div>
                            </div>
                            <div className="relative w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 shadow border border-white/20 shrink-0">
                              <svg className="text-white" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                              </svg>
                              <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full"></div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'story-pop' ? (
                          /* Story Pop Preview */
                          <div className="relative w-[60px] h-[82px] rounded-lg overflow-hidden shadow-md border-2 border-white bg-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 z-0">
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                                </div>
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                            <div className="absolute bottom-0 left-0 w-full p-1 z-20 text-white">
                              <div className="flex items-center gap-0.5 mb-0.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center text-[5px] font-bold">S</div>
                                <span className="text-[6px] font-bold">Sarah</span>
                              </div>
                              <p className="text-[5px] opacity-90">bought!</p>
                            </div>
                            <div className="absolute top-0 left-0 h-0.5 bg-white/30 w-full z-30">
                              <div className="h-full bg-white w-3/4"></div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'floating-tag' ? (
                          /* Floating Tag Preview */
                          <div className="relative flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm" style={{ width: 'fit-content' }}>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z"></path></svg>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[8px] font-medium text-gray-800">Popular</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                              <span className="text-[7px] text-gray-500">120</span>
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-indigo-500"></div>
                          </div>
                        ) : notification.layout_style === 'peekaboo' ? (
                          /* Peekaboo Reveal Preview */
                          <div className="relative flex items-center gap-2 p-2 pr-6 bg-white rounded-r-xl rounded-l-lg shadow-sm border border-gray-100" style={{ width: '160px' }}>
                            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                              <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                            </div>
                            <div className="relative shrink-0">
                              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              </div>
                              <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[6px] font-semibold border border-white" style={{ transform: 'translateX(8px) translateY(6px) scale(0.7)' }}>A</div>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-0.5 text-xs font-bold text-gray-900 leading-none">
                                <span>18</span>
                                <span className="text-[8px] font-medium text-gray-500">viewed</span>
                              </div>
                              <div className="text-[7px] font-medium text-indigo-500 uppercase mt-0.5">Last hour</div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'puzzle' ? (
                          /* Puzzle Reveal Preview */
                          <div className="flex items-center" style={{ height: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                            <div className="relative z-30 flex items-center justify-center w-9 h-9 bg-white rounded-l-xl rounded-r-md">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>A</div>
                              <div className="absolute -right-1 w-2 h-2 bg-white rounded-full z-10"></div>
                            </div>
                            <div className="relative z-20 -ml-1 flex flex-col justify-center px-2 h-9 bg-gray-900 text-white rounded-md min-w-[80px]">
                              <div className="flex items-center gap-0.5 mb-0.5">
                                <span className="p-0.5 rounded-sm bg-yellow-400 text-gray-900">
                                  <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                </span>
                                <span className="text-[6px] font-bold uppercase text-gray-400">purchased</span>
                              </div>
                              <div className="text-[8px] font-medium truncate"><span className="font-bold">Alex</span> got Product</div>
                            </div>
                            <div className="relative z-10 -ml-1 w-9 h-9 bg-white rounded-r-xl rounded-l-md overflow-hidden">
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rounded-full z-20"></div>
                              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                              </div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'parallax' ? (
                          /* Parallax 3D Card Preview */
                          <div 
                            className="relative rounded-lg p-2"
                            style={{ 
                              background: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 relative">
                                <div 
                                  className="w-8 h-8 rounded flex items-center justify-center"
                                  style={{ 
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  </svg>
                                </div>
                                <div 
                                  className="absolute -top-1 -right-1 text-white text-[6px] font-bold px-0.5 rounded"
                                  style={{ background: '#6366f1' }}
                                >NEW</div>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <svg width="6" height="6" viewBox="0 0 24 24" fill="#facc15"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                  <span className="text-[7px] font-bold uppercase text-gray-400">Just Grabbed</span>
                                </div>
                                <div className="text-[9px] font-bold text-white truncate">AI Copywriter Pro</div>
                                <div className="text-[8px] text-gray-400">by <span className="text-gray-200">Nathan D.</span></div>
                              </div>
                            </div>
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b"
                              style={{ background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)', opacity: 0.5 }}
                            />
                          </div>
                        ) : notification.layout_style === 'ripple' ? (
                          /* Ripple Layout Preview */
                          <div 
                            className="flex items-center gap-2 bg-white rounded-full py-1.5 pl-1.5 pr-3"
                            style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
                          >
                            <div className="relative flex-shrink-0" style={{ width: '36px', height: '28px' }}>
                              <div 
                                className="absolute rounded-full border-2 border-white flex items-center justify-center text-white font-semibold text-[8px]"
                                style={{ left: 0, top: '1px', width: '26px', height: '26px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', zIndex: 2 }}
                              >M</div>
                              <div 
                                className="absolute rounded-full border-2 border-white"
                                style={{ left: '12px', top: '1px', width: '26px', height: '26px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', zIndex: 1 }}
                              />
                              <div 
                                className="absolute bg-white rounded-full flex items-center justify-center"
                                style={{ left: '14px', bottom: 0, zIndex: 3, width: '10px', height: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                              >
                                <svg width="6" height="6" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-700"><span className="font-semibold text-indigo-500">Maya</span> from Toronto</div>
                              <div className="text-[9px] text-gray-400">is looking at this</div>
                            </div>
                          </div>
                        ) : (
                          /* Standard Preview */
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            <div className="text-sm">
                              <span className="text-blue-600 font-semibold">{notification.preview.title}</span>
                              <span className="text-gray-700 ml-1">{notification.preview.content}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600">{notification.views} views</span>
                          <span className="text-gray-600">{notification.conversions} conversions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              editWidget(notification.id);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Widget"
                          >
                            <Edit3 className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      {/* Priority */}
                      <div className="col-span-1 flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">#{notification.priority}</span>
                        <Menu className="w-4 h-4 text-gray-400 cursor-move" />
                      </div>

                      {/* Notification */}
                      <div className="col-span-3">
                        <div className="text-sm font-semibold text-gray-900">{notification.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</div>
                      </div>

                      {/* Type */}
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {notification.type}
                        </span>
                      </div>

                      {/* Preview */}
                      <div className="col-span-3">
                        {/* Frosted Token Preview */}
                        {notification.layout_style === 'frosted-token' ? (
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-800">
                            <div className="px-2 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white">
                              <div className="flex items-baseline gap-1 whitespace-nowrap">
                                <span className="font-bold text-[10px]">32</span>
                                <span className="text-[8px] opacity-80">purchased today</span>
                              </div>
                            </div>
                            <div className="relative w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-pink-500 shadow border border-white/20 shrink-0">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-50"></div>
                              <svg className="relative z-10 text-white" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                              </svg>
                              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-red-500"></div>
                              </div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'story-pop' ? (
                          /* Story Pop Preview */
                          <div className="relative w-[80px] h-[110px] rounded-lg overflow-hidden shadow-lg border-2 border-white bg-white">
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
                        ) : notification.layout_style === 'floating-tag' ? (
                          /* Floating Tag Preview */
                          <div className="relative flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-md" style={{ width: 'fit-content', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z"></path></svg>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] font-medium text-gray-800">Popular in Design</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                              <span className="text-[9px] text-gray-500">120 viewing</span>
                            </div>
                            <div className="absolute -top-0.5 -right-0.5">
                              <span className="flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                              </span>
                            </div>
                          </div>
                        ) : notification.layout_style === 'peekaboo' ? (
                          /* Peekaboo Reveal Preview */
                          <div className="relative flex items-center gap-2 p-2.5 pr-8 bg-white rounded-r-2xl rounded-l-lg shadow-md border border-gray-100" style={{ width: '200px' }}>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
                              <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                            </div>
                            <div className="relative shrink-0">
                              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              </div>
                              <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[8px] font-semibold border-2 border-white" style={{ transform: 'translateX(10px) translateY(8px) scale(0.7)' }}>A</div>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-0.5 text-sm font-bold text-gray-900 leading-none">
                                <span>18</span>
                                <span className="text-[10px] font-medium text-gray-500">people viewed</span>
                              </div>
                              <div className="text-[8px] font-medium text-indigo-500 uppercase mt-0.5">In the last hour</div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'puzzle' ? (
                          /* Puzzle Reveal Preview */
                          <div className="flex items-center" style={{ height: '44px', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))' }}>
                            <div className="relative z-30 flex items-center justify-center w-11 h-11 bg-white rounded-l-xl rounded-r-md">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>A</div>
                              <div className="absolute -right-1 w-2.5 h-2.5 bg-white rounded-full z-10"></div>
                            </div>
                            <div className="relative z-20 -ml-1.5 flex flex-col justify-center px-4 h-11 bg-gray-900 text-white rounded-md min-w-[120px]">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="p-0.5 rounded-sm bg-yellow-400 text-gray-900">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                                </span>
                                <span className="text-[8px] font-bold uppercase text-gray-400">purchased</span>
                              </div>
                              <div className="text-[10px] font-medium truncate"><span className="font-bold">Alex</span> got Neon High-Tops</div>
                            </div>
                            <div className="relative z-10 -ml-1.5 w-11 h-11 bg-white rounded-r-xl rounded-l-md overflow-hidden">
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-900 rounded-full z-20"></div>
                              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                              </div>
                            </div>
                          </div>
                        ) : notification.layout_style === 'parallax' ? (
                          /* Parallax 3D Card Preview */
                          <div 
                            className="relative rounded-lg p-3"
                            style={{ 
                              background: 'rgba(17, 24, 39, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)'
                            }}
                          >
                            <div className="flex items-center gap-3">
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
                                <div 
                                  className="absolute -top-1 -right-1 text-white text-[7px] font-bold px-1 py-0.5 rounded"
                                  style={{ background: '#6366f1', border: '1px solid #818cf8' }}
                                >NEW</div>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#facc15"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Just Grabbed</span>
                                </div>
                                <div className="text-xs font-bold text-white truncate">AI Copywriter Pro</div>
                                <div className="text-[10px] text-gray-400">by <span className="text-gray-200">Nathan D.</span> • Marketing</div>
                              </div>
                            </div>
                            <div 
                              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
                              style={{ background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)', opacity: 0.5 }}
                            />
                          </div>
                        ) : notification.layout_style === 'ripple' ? (
                          /* Ripple Layout Preview */
                          <div 
                            className="flex items-center gap-2.5 bg-white rounded-full py-2 pl-2 pr-4 border border-gray-100"
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                          >
                            <div className="relative flex-shrink-0" style={{ width: '44px', height: '34px' }}>
                              <div 
                                className="absolute rounded-full border-2 border-white flex items-center justify-center text-white font-semibold text-[10px]"
                                style={{ left: 0, top: '2px', width: '30px', height: '30px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', zIndex: 2 }}
                              >M</div>
                              <div 
                                className="absolute rounded-full border-2 border-white"
                                style={{ left: '16px', top: '2px', width: '30px', height: '30px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', zIndex: 1 }}
                              />
                              <div 
                                className="absolute bg-white rounded-full flex items-center justify-center"
                                style={{ left: '18px', bottom: 0, zIndex: 3, width: '12px', height: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                              >
                                <svg width="7" height="7" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs text-gray-700"><span className="font-semibold text-indigo-500">Maya</span> from Toronto</div>
                              <div className="text-[10px] text-gray-400">is looking at this</div>
                            </div>
                          </div>
                        ) : (
                          /* Standard Preview */
                          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-sm min-w-0">
                                <span className="text-blue-600 font-semibold">{notification.preview.title}</span>
                                <span className="text-gray-700 ml-1 truncate block">{notification.preview.content}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-500">{notification.preview.timestamp}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Performance */}
                      <div className="col-span-2">
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">{notification.views.toLocaleString()} views</div>
                          <div className="text-xs text-gray-500">{notification.conversions} conversions • {notification.ctr}% CTR</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Toggle Switch */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNotificationStatus(notification.id);
                            }}
                            className={`w-11 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${
                              notification.status === 'active' ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                              notification.status === 'active' ? 'right-0.5' : 'left-0.5'
                            }`}></div>
                          </button>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              editWidget(notification.id);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Widget"
                          >
                            <Edit3 className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-20 text-center">
                <div className="max-w-md mx-auto">
                  {sites.length === 0 ? (
                    <>
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Globe className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">No sites added yet</h3>
                      <p className="text-gray-600 mb-6 text-lg">
                        Add a site first to create notifications
                      </p>
                      <button 
                        onClick={() => onSectionChange('sites')}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Your First Site
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">No notifications yet</h3>
                      <p className="text-gray-600 mb-6 text-lg">
                        Create your first social proof notification for {sites.find(s => s.id === selectedSiteId)?.domain || sites.find(s => s.id === selectedSiteId)?.name}
                      </p>
                      <button 
                        onClick={() => onSectionChange('create-notification')}
                        disabled={!selectedSiteId}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your First Notification
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-8"></div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          loading={confirmModal.loading}
        />
      </div>
    );
  }

  // Sites screen
  if (activeSection === 'sites') {
    return (
      <div className="flex-1 bg-gray-50 min-h-screen">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Your Sites</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your websites and pixel integrations</p>
            </div>
            <button
              onClick={() => setShowAddSiteModal(true)}
              className="inline-flex items-center px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base font-medium touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add New Site
            </button>
          </div>

          {/* Sites Grid */}
          {loading ? (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-12 sm:p-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600">Loading sites...</p>
            </div>
          ) : sites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sites.map((site) => {
                const widgetCount = allWidgets.filter(w => w.config.site_id === site.id).length;
                return (
                  <div key={site.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{site.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate mt-0.5">{site.domain || 'No domain set'}</p>
                          </div>
                        </div>
                        {(() => {
                          const isPixelActive = site.last_ping && 
                            (new Date().getTime() - new Date(site.last_ping).getTime()) < 24 * 60 * 60 * 1000;
                          
                          if (isPixelActive) {
                            return (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                Active
                              </span>
                            );
                          } else if (site.verified) {
                            return (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                Inactive
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                                Pending
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Widgets</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-900">{widgetCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Created</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{formatDate(site.created_at)}</p>
                        </div>
                      </div>

                      {/* Site ID */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Site ID</p>
                        <p className="text-xs sm:text-sm font-mono text-gray-900">{site.public_key.substring(0, 16)}...</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 pt-2">
                        <button 
                          onClick={() => handlePixelIntegration(site)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium touch-manipulation"
                        >
                          <Code className="w-4 h-4" />
                          <span>Pixel Integration</span>
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => toggleSiteStatus(site.id, site.is_active)}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                          >
                            {site.is_active ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => deleteSite(site.id)}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-12 sm:p-20 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">No sites added yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Add your first site to get started with social proof notifications
                </p>
                  <button 
                    onClick={() => setShowAddSiteModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Site
                  </button>
              </div>
            </div>
          )}
        </div>

        <AddSiteModal
          isOpen={showAddSiteModal}
          onClose={() => setShowAddSiteModal(false)}
          onSiteAdded={fetchSites}
          onPixelIntegrationRedirect={(site) => {
            setSelectedSite(site);
            onSectionChange('pixel-integration');
          }}
          userId={userId || ''}
        />
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          loading={confirmModal.loading}
        />
      </div>
    );
  }

  // Integration screen
  if (activeSection === 'pixel-integration' && selectedSite) {
    return (
      <>
        <PixelIntegration 
          selectedSite={selectedSite} 
          onBack={() => onSectionChange('sites')} 
        />
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          loading={confirmModal.loading}
        />
      </>
    );
  }
  
  // Widget editor screen
  if (activeSection === 'edit-widget' && selectedWidgetId) {
    console.log('Rendering widget editor for widget ID:', selectedWidgetId);
    return (
      <>
        <WidgetEditorWithPreview 
          widgetId={selectedWidgetId}
          onBack={() => {
            // Clear the widget ID and go back to notifications
            setSelectedWidgetId(null);
            localStorage.removeItem('lastWidgetId');
            onSectionChange('notifications');
            
            // Also clear the URL parameter if present
            if (window.history && window.history.pushState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('widgetId');
              window.history.pushState({}, '', url);
            }
          }}
        />
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          loading={confirmModal.loading}
        />
      </>
    );
  }

  // Account settings screen
  if (activeSection === 'settings') {
    return <Account onNavigate={onSectionChange} />;
  }

  // Analytics screen
  if (activeSection === 'analytics' && userId) {
    return <Analytics userId={userId} />;
  }

  // Default content for other sections
  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center min-h-full">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
        </h2>
        <p className="text-gray-600 mb-6">This section is under development. Check back soon for new features!</p>
        <button 
          onClick={() => onSectionChange('notifications')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Notifications
        </button>
      </div>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        loading={confirmModal.loading}
      />
    </div>
  );
}