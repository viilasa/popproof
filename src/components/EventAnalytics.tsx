import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, Users, Clock, Eye } from 'lucide-react';

interface AnalyticsData {
  totalEvents: number;
  eventsToday: number;
  topEventTypes: Array<{ event_type: string; count: number }>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    user_name: string;
    product_name: string | null;
    location: string | null;
    timestamp: string;
  }>;
}

interface EventAnalyticsProps {
  userId: string;
}

export function EventAnalytics({ userId }: EventAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientIds, setClientIds] = useState<string[]>([]);

  useEffect(() => {
    fetchClientIds();
  }, [userId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchAnalytics();
    }
  }, [selectedClientId]);

  const fetchClientIds = async () => {
    try {
      // Get client IDs from API keys
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('public_key')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const ids = apiKeys?.map(key => key.public_key) || [];
      setClientIds(ids);
      
      if (ids.length > 0 && !selectedClientId) {
        setSelectedClientId(ids[0]);
      }
    } catch (error) {
      console.error('Error fetching client IDs:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedClientId) return;

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch total events
      const { count: totalEvents } = await supabase
        .from('social_proof_events')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', selectedClientId);

      // Fetch events today
      const { count: eventsToday } = await supabase
        .from('social_proof_events')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', selectedClientId)
        .gte('timestamp', today.toISOString());

      // Fetch top event types
      const { data: eventTypes } = await supabase
        .from('social_proof_events')
        .select('event_type')
        .eq('client_id', selectedClientId);

      const eventTypeCounts = eventTypes?.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topEventTypes = Object.entries(eventTypeCounts)
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Fetch recent events
      const { data: recentEvents } = await supabase
        .from('social_proof_events')
        .select('id, event_type, user_name, product_name, location, timestamp')
        .eq('client_id', selectedClientId)
        .order('timestamp', { ascending: false })
        .limit(10);

      setAnalytics({
        totalEvents: totalEvents || 0,
        eventsToday: eventsToday || 0,
        topEventTypes,
        recentEvents: recentEvents || [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (clientIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Create an API key first to start collecting analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
          <p className="text-gray-600 mt-1">View your social proof widget performance</p>
        </div>
        
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {clientIds.map((clientId) => (
            <option key={clientId} value={clientId}>
              {clientId.substring(0, 12)}...
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : analytics ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Events Today</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.eventsToday}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Event Type</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.topEventTypes[0]?.event_type || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.recentEvents.length > 0 ? 'Active' : 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Event Types */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Event Types</h3>
              {analytics.topEventTypes.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topEventTypes.map((eventType, index) => (
                    <div key={eventType.event_type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{eventType.event_type}</span>
                      </div>
                      <span className="text-sm text-gray-600">{eventType.count} events</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No events yet</p>
              )}
            </div>

            {/* Recent Events */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
              {analytics.recentEvents.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analytics.recentEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <Eye className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {event.user_name} • {event.event_type}
                        </p>
                        {event.product_name && (
                          <p className="text-sm text-gray-600">{event.product_name}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          {event.location && (
                            <span className="text-xs text-gray-500">{event.location}</span>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent events</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}