import { useState, useEffect } from 'react';
import { TrendingUp, Eye, MousePointer, Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Site {
  id: string;
  name: string;
}

interface AnalyticsData {
  totalEvents: number;
  totalNotifications: number;
  totalImpressions: number;
  totalClicks: number;
  clickRate: number;
  activeVisitors: number;
  trend: {
    events: number;
    notifications: number;
    impressions: number;
  };
}

interface DailyStats {
  date: string;
  events: number;
  impressions: number;
  clicks: number;
}

interface AnalyticsProps {
  userId: string;
}

export default function Analytics({ userId }: AnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEvents: 0,
    totalNotifications: 0,
    totalImpressions: 0,
    totalClicks: 0,
    clickRate: 0,
    activeVisitors: 0,
    trend: { events: 0, notifications: 0, impressions: 0 },
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('7');

  useEffect(() => {
    fetchSites();
  }, [userId]);

  useEffect(() => {
    if (selectedSiteId) {
      fetchAnalytics();
      fetchDailyStats();
    }
  }, [selectedSiteId, dateRange]);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSites(data || []);
      if (data && data.length > 0) {
        setSelectedSiteId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSiteId);

      // Fetch total notifications
      const { count: totalNotifications } = await supabase
        .from('event_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSiteId);

      // Fetch impressions and clicks
      const { data: notificationData } = await supabase
        .from('event_notifications')
        .select('impression_count, click_count')
        .eq('site_id', selectedSiteId);

      const totalImpressions = notificationData?.reduce((sum, n) => sum + (n.impression_count || 0), 0) || 0;
      const totalClicks = notificationData?.reduce((sum, n) => sum + (n.click_count || 0), 0) || 0;
      const clickRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Fetch previous period for trends
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

      const { count: prevEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSiteId)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const { count: recentEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', selectedSiteId)
        .gte('created_at', startDate.toISOString());

      const eventTrend = prevEvents && prevEvents > 0 
        ? ((recentEvents || 0) - prevEvents) / prevEvents * 100 
        : 0;

      // Get active visitors (last 30 minutes)
      const thirtyMinAgo = new Date();
      thirtyMinAgo.setMinutes(thirtyMinAgo.getMinutes() - 30);

      const { data: recentEvents2 } = await supabase
        .from('events')
        .select('session_id')
        .eq('site_id', selectedSiteId)
        .gte('created_at', thirtyMinAgo.toISOString());

      const activeVisitors = new Set(recentEvents2?.map(e => e.session_id)).size;

      setAnalytics({
        totalEvents: totalEvents || 0,
        totalNotifications: totalNotifications || 0,
        totalImpressions,
        totalClicks,
        clickRate,
        activeVisitors,
        trend: {
          events: eventTrend,
          notifications: 0,
          impressions: 0,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch events by day
      const { data: events } = await supabase
        .from('events')
        .select('created_at')
        .eq('site_id', selectedSiteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Fetch notifications by day
      const { data: notifications } = await supabase
        .from('event_notifications')
        .select('created_at, impression_count, click_count')
        .eq('site_id', selectedSiteId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const statsMap = new Map<string, DailyStats>();

      events?.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        const existing = statsMap.get(date) || { date, events: 0, impressions: 0, clicks: 0 };
        existing.events += 1;
        statsMap.set(date, existing);
      });

      notifications?.forEach(notif => {
        const date = new Date(notif.created_at).toISOString().split('T')[0];
        const existing = statsMap.get(date) || { date, events: 0, impressions: 0, clicks: 0 };
        existing.impressions += notif.impression_count || 0;
        existing.clicks += notif.click_count || 0;
        statsMap.set(date, existing);
      });

      const stats = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setDailyStats(stats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const maxValue = Math.max(...dailyStats.map(s => Math.max(s.events, s.impressions, s.clicks)), 1);

  if (loading && !selectedSiteId) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No sites found. Create a site first to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {/* Site Selector */}
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>

            {/* Date Range Selector */}
            <div className="flex space-x-2">
              {(['7', '30', '90'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {range} days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              {analytics.trend.events !== 0 && (
                <div className={`flex items-center space-x-1 text-sm ${
                  analytics.trend.events > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.trend.events > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{Math.abs(analytics.trend.events).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalEvents.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>

          {/* Total Impressions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalImpressions.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Impressions</p>
          </div>

          {/* Total Clicks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalClicks.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Clicks</p>
            <p className="text-xs text-gray-500 mt-1">CTR: {analytics.clickRate.toFixed(2)}%</p>
          </div>

          {/* Active Visitors */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.activeVisitors}</h3>
            <p className="text-sm text-gray-600">Active Now</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Over Time</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Events</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">Impressions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Clicks</span>
              </div>
            </div>
          </div>

          {dailyStats.length > 0 ? (
            <div className="space-y-4">
              {dailyStats.map((stat) => (
                <div key={stat.date} className="flex items-center space-x-4">
                  <div className="w-20 text-xs text-gray-600">
                    {new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 space-y-1">
                    {/* Events Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${(stat.events / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{stat.events}</span>
                    </div>
                    {/* Impressions Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all"
                          style={{ width: `${(stat.impressions / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{stat.impressions}</span>
                    </div>
                    {/* Clicks Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{ width: `${(stat.clicks / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{stat.clicks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No data available for the selected period</p>
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Created</span>
                <span className="font-semibold text-gray-900">{analytics.totalNotifications.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Impressions</span>
                <span className="font-semibold text-gray-900">{analytics.totalImpressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg per Notification</span>
                <span className="font-semibold text-gray-900">
                  {analytics.totalNotifications > 0 
                    ? (analytics.totalImpressions / analytics.totalNotifications).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Engagement Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Click Rate</span>
                <span className="font-semibold text-gray-900">{analytics.clickRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Clicks</span>
                <span className="font-semibold text-gray-900">{analytics.totalClicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Events per Visitor</span>
                <span className="font-semibold text-gray-900">
                  {analytics.activeVisitors > 0 
                    ? (analytics.totalEvents / analytics.activeVisitors).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
