import { useState, useEffect } from 'react';
import { Activity, Users, MousePointer, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RealTimeEventsProps {
  siteId: string;
}

interface LiveEvent {
  id: string;
  event_type: string;
  url: string;
  timestamp: string;
  session_id: string;
  user_agent?: string;
  event_data?: any;
}

interface LiveStats {
  totalEvents: number;
  activeSessions: number;
  pageViews: number;
  conversions: number;
}

export function RealTimeEvents({ siteId }: RealTimeEventsProps) {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [stats, setStats] = useState<LiveStats>({
    totalEvents: 0,
    activeSessions: 0,
    pageViews: 0,
    conversions: 0
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!siteId) return;

    // Fetch initial data
    const fetchInitialData = async () => {
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('site_id', siteId)
        .order('timestamp', { ascending: false })
        .limit(50);

      const { data: sessions } = await supabase
        .from('session_tracking')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (events) {
        setLiveEvents(events);
        setStats({
          totalEvents: events.length,
          activeSessions: sessions?.length || 0,
          pageViews: events.filter(e => e.event_type === 'page_view').length,
          conversions: events.filter(e => ['purchase', 'signup', 'conversion'].includes(e.event_type)).length
        });
      }
    };

    fetchInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`events_${siteId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `site_id=eq.${siteId}`
      }, (payload) => {
        console.log('New event received:', payload);
        const newEvent = payload.new as LiveEvent;
        
        setLiveEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        setStats(prev => ({
          totalEvents: prev.totalEvents + 1,
          activeSessions: prev.activeSessions,
          pageViews: prev.pageViews + (newEvent.event_type === 'page_view' ? 1 : 0),
          conversions: prev.conversions + (['purchase', 'signup', 'conversion'].includes(newEvent.event_type) ? 1 : 0)
        }));

        // Show notification for important events
        if (['purchase', 'signup'].includes(newEvent.event_type)) {
          showNotification(newEvent);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId]);

  const showNotification = (event: LiveEvent) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ProofPop: New Conversion!', {
        body: `${event.event_type} event on ${new URL(event.url).hostname}`,
        icon: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'click':
        return <MousePointer className="w-4 h-4 text-green-600" />;
      case 'purchase':
      case 'signup':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatEventData = (event: LiveEvent) => {
    const url = new URL(event.url);
    const timeAgo = new Date(Date.now() - new Date(event.timestamp).getTime()).toISOString().substr(11, 8);
    
    return {
      domain: url.hostname,
      path: url.pathname,
      timeAgo: timeAgo.replace(/^00:/, '').replace(/^0/, '')
    };
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Events</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={requestNotificationPermission}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Enable Notifications
          </button>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Events</p>
              <p className="text-xl font-bold">{stats.totalEvents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold">{stats.activeSessions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Eye className="w-6 h-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Views</p>
              <p className="text-xl font-bold">{stats.pageViews}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-xl font-bold">{stats.conversions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-semibold">Live Event Feed</h4>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {liveEvents.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {liveEvents.map((event) => {
                const { domain, path, timeAgo } = formatEventData(event);
                return (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getEventIcon(event.event_type)}
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {event.event_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {domain}{path}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{timeAgo} ago</p>
                        <p className="text-xs text-gray-400">
                          {event.session_id?.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    {event.event_data && Object.keys(event.event_data).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                        {JSON.stringify(event.event_data, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No events yet. Waiting for activity...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
