import { useState, useEffect } from 'react';
import { Eye, Users, Calendar, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Site {
  id: string;
  name: string;
}

interface WidgetStats {
  widget_id: string;
  widget_name: string;
  impressions: number;
  unique_viewers: number;
  avg_time_visible: number;
  engagement_rate: number;
}

interface AnalyticsData {
  totalImpressions: number;
  uniqueViewers: number;
  activeVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  viewabilityRate: number;
  widgetStats: WidgetStats[];
  trend: {
    impressions: number;
    viewers: number;
  };
}

interface DailyStats {
  date: string;
  impressions: number;
  unique_viewers: number;
  page_views: number;
}

interface AnalyticsProps {
  userId: string;
}

export default function Analytics({ userId }: AnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalImpressions: 0,
    uniqueViewers: 0,
    activeVisitors: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
    viewabilityRate: 0,
    widgetStats: [],
    trend: { impressions: 0, viewers: 0 },
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
      const startDateISO = startDate.toISOString();

      // Fetch impressions from notification_analytics
      const { data: analyticsData } = await supabase
        .from('notification_analytics')
        .select('widget_id, action_type, session_id, timestamp')
        .eq('site_id', selectedSiteId)
        .gte('timestamp', startDateISO);

      // Calculate total impressions (views)
      const impressions = analyticsData?.filter(a => a.action_type === 'view') || [];
      const totalImpressions = impressions.length;

      // Calculate unique viewers (unique sessions that saw notifications)
      const uniqueViewerSessions = new Set(impressions.map(a => a.session_id));
      const uniqueViewers = uniqueViewerSessions.size;

      // Get active visitors (last 5 minutes)
      const fiveMinAgo = new Date();
      fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);

      const { data: recentPageViews } = await supabase
        .from('events')
        .select('session_id')
        .eq('site_id', selectedSiteId)
        .eq('event_type', 'page_view')
        .gte('timestamp', fiveMinAgo.toISOString());

      const activeVisitors = new Set(recentPageViews?.map(e => e.session_id)).size;

      // Calculate avg time on page from page_view events
      const { data: pageViews } = await supabase
        .from('events')
        .select('session_id, timestamp, metadata')
        .eq('site_id', selectedSiteId)
        .eq('event_type', 'page_view')
        .gte('timestamp', startDateISO)
        .order('timestamp', { ascending: true });

      // Calculate average session duration
      let totalSessionTime = 0;
      let sessionCount = 0;
      const sessionTimes: Record<string, { first: Date; last: Date }> = {};
      
      pageViews?.forEach(pv => {
        const sessionId = pv.session_id;
        const timestamp = new Date(pv.timestamp);
        if (!sessionTimes[sessionId]) {
          sessionTimes[sessionId] = { first: timestamp, last: timestamp };
        } else {
          if (timestamp < sessionTimes[sessionId].first) sessionTimes[sessionId].first = timestamp;
          if (timestamp > sessionTimes[sessionId].last) sessionTimes[sessionId].last = timestamp;
        }
      });

      Object.values(sessionTimes).forEach(session => {
        const duration = (session.last.getTime() - session.first.getTime()) / 1000; // in seconds
        if (duration > 0 && duration < 3600) { // Ignore sessions longer than 1 hour (likely abandoned)
          totalSessionTime += duration;
          sessionCount++;
        }
      });

      const avgTimeOnPage = sessionCount > 0 ? totalSessionTime / sessionCount : 0;

      // Calculate bounce rate (sessions with only 1 page view)
      const sessionPageCounts: Record<string, number> = {};
      pageViews?.forEach(pv => {
        sessionPageCounts[pv.session_id] = (sessionPageCounts[pv.session_id] || 0) + 1;
      });
      const totalSessions = Object.keys(sessionPageCounts).length;
      const bouncedSessions = Object.values(sessionPageCounts).filter(count => count === 1).length;
      const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

      // Calculate viewability rate (impressions / total page views)
      const totalPageViews = pageViews?.length || 0;
      const viewabilityRate = totalPageViews > 0 ? (totalImpressions / totalPageViews) * 100 : 0;

      // Get per-widget stats
      const { data: widgets } = await supabase
        .from('widgets')
        .select('id, name')
        .eq('site_id', selectedSiteId)
        .eq('is_active', true);

      const widgetStats: WidgetStats[] = (widgets || []).map(widget => {
        const widgetImpressions = impressions.filter(a => a.widget_id === widget.id);
        const widgetViewers = new Set(widgetImpressions.map(a => a.session_id)).size;
        
        return {
          widget_id: widget.id,
          widget_name: widget.name || 'Unnamed Widget',
          impressions: widgetImpressions.length,
          unique_viewers: widgetViewers,
          avg_time_visible: 8, // Default display duration
          engagement_rate: uniqueViewers > 0 ? (widgetViewers / uniqueViewers) * 100 : 0
        };
      });

      // Calculate trends (compare with previous period)
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

      const { data: prevAnalytics } = await supabase
        .from('notification_analytics')
        .select('action_type, session_id')
        .eq('site_id', selectedSiteId)
        .gte('timestamp', prevStartDate.toISOString())
        .lt('timestamp', startDateISO);

      const prevImpressions = prevAnalytics?.filter(a => a.action_type === 'view').length || 0;
      const prevViewers = new Set(prevAnalytics?.filter(a => a.action_type === 'view').map(a => a.session_id)).size;

      const impressionTrend = prevImpressions > 0 
        ? ((totalImpressions - prevImpressions) / prevImpressions) * 100 
        : 0;
      const viewerTrend = prevViewers > 0 
        ? ((uniqueViewers - prevViewers) / prevViewers) * 100 
        : 0;

      setAnalytics({
        totalImpressions,
        uniqueViewers,
        activeVisitors,
        avgTimeOnPage,
        bounceRate,
        viewabilityRate,
        widgetStats,
        trend: {
          impressions: impressionTrend,
          viewers: viewerTrend,
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

      // Fetch impressions from notification_analytics
      const { data: analyticsData } = await supabase
        .from('notification_analytics')
        .select('timestamp, session_id, action_type')
        .eq('site_id', selectedSiteId)
        .eq('action_type', 'view')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      // Fetch page views
      const { data: pageViews } = await supabase
        .from('events')
        .select('timestamp, session_id')
        .eq('site_id', selectedSiteId)
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      // Group by date
      const statsMap = new Map<string, DailyStats>();

      // Initialize all dates in range
      for (let i = 0; i < daysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        statsMap.set(dateStr, { date: dateStr, impressions: 0, unique_viewers: 0, page_views: 0 });
      }

      // Count impressions and unique viewers per day
      const dailyViewers = new Map<string, Set<string>>();
      
      analyticsData?.forEach(record => {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        const existing = statsMap.get(date) || { date, impressions: 0, unique_viewers: 0, page_views: 0 };
        existing.impressions += 1;
        
        if (!dailyViewers.has(date)) {
          dailyViewers.set(date, new Set());
        }
        dailyViewers.get(date)!.add(record.session_id);
        
        statsMap.set(date, existing);
      });

      // Count page views per day
      pageViews?.forEach(pv => {
        const date = new Date(pv.timestamp).toISOString().split('T')[0];
        const existing = statsMap.get(date);
        if (existing) {
          existing.page_views += 1;
          statsMap.set(date, existing);
        }
      });

      // Update unique viewers count
      dailyViewers.forEach((viewers, date) => {
        const existing = statsMap.get(date);
        if (existing) {
          existing.unique_viewers = viewers.size;
          statsMap.set(date, existing);
        }
      });

      const stats = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setDailyStats(stats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const maxValue = Math.max(...dailyStats.map(s => Math.max(s.impressions, s.unique_viewers, s.page_views)), 1);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Impressions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              {analytics.trend.impressions !== 0 && (
                <div className={`flex items-center space-x-1 text-sm ${
                  analytics.trend.impressions > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.trend.impressions > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{Math.abs(analytics.trend.impressions).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.totalImpressions.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Impressions</p>
            <p className="text-xs text-gray-500 mt-1">Notifications shown to visitors</p>
          </div>

          {/* Unique Viewers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              {analytics.trend.viewers !== 0 && (
                <div className={`flex items-center space-x-1 text-sm ${
                  analytics.trend.viewers > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.trend.viewers > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{Math.abs(analytics.trend.viewers).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.uniqueViewers.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Unique Viewers</p>
            <p className="text-xs text-gray-500 mt-1">Visitors who saw notifications</p>
          </div>

          {/* Active Visitors */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.activeVisitors}</h3>
            <p className="text-sm text-gray-600">Active Now</p>
            <p className="text-xs text-gray-500 mt-1">Visitors in last 5 minutes</p>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Avg Time on Page */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{formatTime(analytics.avgTimeOnPage)}</h3>
            <p className="text-sm text-gray-600">Avg Session Duration</p>
            <p className="text-xs text-gray-500 mt-1">Average time visitors spend on site</p>
          </div>

          {/* Bounce Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.bounceRate.toFixed(1)}%</h3>
            <p className="text-sm text-gray-600">Bounce Rate</p>
            <p className="text-xs text-gray-500 mt-1">Single-page sessions</p>
          </div>

          {/* Viewability Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analytics.viewabilityRate.toFixed(1)}%</h3>
            <p className="text-sm text-gray-600">Viewability Rate</p>
            <p className="text-xs text-gray-500 mt-1">Impressions per page view</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Over Time</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">Impressions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Unique Viewers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Page Views</span>
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
                    {/* Unique Viewers Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${(stat.unique_viewers / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{stat.unique_viewers}</span>
                    </div>
                    {/* Page Views Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{ width: `${(stat.page_views / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{stat.page_views}</span>
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

        {/* Widget Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Widget Performance</h3>
          {analytics.widgetStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Widget</th>
                    <th className="pb-3 font-medium text-right">Impressions</th>
                    <th className="pb-3 font-medium text-right">Unique Viewers</th>
                    <th className="pb-3 font-medium text-right">Reach Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.widgetStats.map((widget) => (
                    <tr key={widget.widget_id} className="text-sm">
                      <td className="py-3 font-medium text-gray-900">{widget.widget_name}</td>
                      <td className="py-3 text-right text-gray-600">{widget.impressions.toLocaleString()}</td>
                      <td className="py-3 text-right text-gray-600">{widget.unique_viewers.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          widget.engagement_rate >= 50 ? 'bg-green-100 text-green-800' :
                          widget.engagement_rate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {widget.engagement_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No widget data available</p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Impressions Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impressions Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Impressions</span>
                <span className="font-semibold text-gray-900">{analytics.totalImpressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Viewers</span>
                <span className="font-semibold text-gray-900">{analytics.uniqueViewers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Impressions per Viewer</span>
                <span className="font-semibold text-gray-900">
                  {analytics.uniqueViewers > 0 
                    ? (analytics.totalImpressions / analytics.uniqueViewers).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Engagement Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Engagement</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Session Duration</span>
                <span className="font-semibold text-gray-900">{formatTime(analytics.avgTimeOnPage)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bounce Rate</span>
                <span className={`font-semibold ${analytics.bounceRate > 70 ? 'text-red-600' : analytics.bounceRate > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {analytics.bounceRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Viewability Rate</span>
                <span className={`font-semibold ${analytics.viewabilityRate > 50 ? 'text-green-600' : analytics.viewabilityRate > 25 ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {analytics.viewabilityRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
