import { useState, useEffect } from 'react';
import { Eye, Users, Calendar, Clock, Activity, ChevronDown, BarChart3, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  Card, StatCard, Badge, Spinner, 
  LineChart, DonutChart, ProgressBar,
  Table, Sparkline
} from '../components/ui';

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

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading && !selectedSiteId) {
    return (
      <div className="flex-1 bg-surface-50 flex flex-col items-center justify-center gap-4 lg:rounded-tl-3xl overflow-hidden">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-surface-500">Loading analytics...</p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="flex-1 bg-surface-50 flex items-center justify-center lg:rounded-tl-3xl overflow-hidden">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-2">No Sites Found</h3>
          <p className="text-surface-500 mb-6">Create a site first to start tracking analytics and see your data here.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const impressionsData = dailyStats.map(s => s.impressions);
  const chartLabels = dailyStats.map(s => 
    new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  return (
    <div className="flex-1 bg-surface-50 min-h-screen lg:rounded-tl-3xl overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-surface-900">Analytics</h1>
              <p className="text-surface-500 mt-1">Track your notification performance and visitor engagement</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Site Selector */}
              <div className="relative">
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-medium text-surface-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
              </div>

              {/* Date Range Selector */}
              <div className="inline-flex bg-white border border-surface-200 rounded-xl p-1">
                {(['7', '30', '90'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      dateRange === range
                        ? 'bg-brand-600 text-white shadow-soft-sm'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                    }`}
                  >
                    {range}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
          {/* Total Impressions */}
          <StatCard
            label="Total Impressions"
            value={analytics.totalImpressions.toLocaleString()}
            change={analytics.trend.impressions}
            changeLabel="vs previous period"
            icon={<Eye className="w-5 h-5 text-brand-600" />}
            iconBg="bg-brand-50"
          />

          {/* Unique Viewers */}
          <StatCard
            label="Unique Viewers"
            value={analytics.uniqueViewers.toLocaleString()}
            change={analytics.trend.viewers}
            changeLabel="vs previous period"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
          />

          {/* Active Visitors */}
          <Card className="group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-surface-500">Active Now</p>
                <p className="text-2xl font-bold text-surface-900 tracking-tight">
                  {analytics.activeVisitors}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                  </span>
                  <span className="text-xs text-surface-400">Live visitors</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success-50 transition-transform duration-200 group-hover:scale-110">
                <Activity className="w-5 h-5 text-success-600" />
              </div>
            </div>
          </Card>

          {/* Avg Session */}
          <StatCard
            label="Avg Session"
            value={formatTime(analytics.avgTimeOnPage)}
            icon={<Clock className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-50"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <Card padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-surface-900">Activity Overview</h2>
                <p className="text-sm text-surface-500 mt-0.5">Impressions over the last {dateRange} days</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                  <span className="text-surface-600">Impressions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-surface-600">Viewers</span>
                </div>
              </div>
            </div>
            
            {impressionsData.length > 0 ? (
              <LineChart 
                data={impressionsData} 
                labels={chartLabels.length > 7 ? [chartLabels[0], chartLabels[Math.floor(chartLabels.length/2)], chartLabels[chartLabels.length-1]] : chartLabels}
                height={240}
                color="#6366f1"
                showArea={true}
                showDots={impressionsData.length <= 14}
              />
            ) : (
              <div className="h-60 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                  <p className="text-surface-500">No data for this period</p>
                </div>
              </div>
            )}
          </Card>

          {/* Engagement Donut */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Engagement Breakdown</h2>
            <DonutChart
              data={[
                { label: 'Viewed', value: analytics.viewabilityRate, color: '#6366f1' },
                { label: 'Bounced', value: analytics.bounceRate, color: '#f59e0b' },
                { label: 'Engaged', value: Math.max(0, 100 - analytics.bounceRate - analytics.viewabilityRate), color: '#10b981' },
              ]}
              size={140}
              strokeWidth={20}
              centerValue={`${analytics.viewabilityRate.toFixed(0)}%`}
              centerLabel="Viewability"
            />
          </Card>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-surface-700">Bounce Rate</span>
              <Badge variant={analytics.bounceRate > 70 ? 'danger' : analytics.bounceRate > 50 ? 'warning' : 'success'}>
                {analytics.bounceRate > 70 ? 'High' : analytics.bounceRate > 50 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <ProgressBar 
              value={analytics.bounceRate} 
              max={100}
              color={analytics.bounceRate > 70 ? 'bg-danger-500' : analytics.bounceRate > 50 ? 'bg-warning-500' : 'bg-success-500'}
              showValue={true}
              label=""
            />
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-surface-700">Viewability Rate</span>
              <Badge variant={analytics.viewabilityRate > 50 ? 'success' : analytics.viewabilityRate > 25 ? 'warning' : 'default'}>
                {analytics.viewabilityRate > 50 ? 'Good' : analytics.viewabilityRate > 25 ? 'Fair' : 'Low'}
              </Badge>
            </div>
            <ProgressBar 
              value={analytics.viewabilityRate} 
              max={100}
              color={analytics.viewabilityRate > 50 ? 'bg-success-500' : analytics.viewabilityRate > 25 ? 'bg-warning-500' : 'bg-surface-400'}
              showValue={true}
              label=""
            />
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-surface-700">Impressions/Viewer</span>
              <span className="text-sm font-semibold text-surface-900">
                {analytics.uniqueViewers > 0 
                  ? (analytics.totalImpressions / analytics.uniqueViewers).toFixed(1)
                  : '0'}
              </span>
            </div>
            <ProgressBar 
              value={analytics.uniqueViewers > 0 ? Math.min((analytics.totalImpressions / analytics.uniqueViewers) * 20, 100) : 0} 
              max={100}
              color="bg-brand-500"
              showValue={false}
              label=""
            />
            <p className="text-xs text-surface-400 mt-2">Average notifications per visitor</p>
          </Card>
        </div>

        {/* Widget Performance Table */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Widget Performance</h2>
              <p className="text-sm text-surface-500 mt-0.5">Individual notification performance metrics</p>
            </div>
            {analytics.widgetStats.length > 0 && (
              <Badge variant="brand">{analytics.widgetStats.length} widgets</Badge>
            )}
          </div>
          
          {analytics.widgetStats.length > 0 ? (
            <Table
              columns={[
                { 
                  key: 'widget_name', 
                  header: 'Widget Name',
                  render: (value) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="font-medium text-surface-900">{value}</span>
                    </div>
                  )
                },
                { 
                  key: 'impressions', 
                  header: 'Impressions', 
                  align: 'right',
                  sortable: true,
                  render: (value) => (
                    <span className="font-medium">{value.toLocaleString()}</span>
                  )
                },
                { 
                  key: 'unique_viewers', 
                  header: 'Viewers', 
                  align: 'right',
                  sortable: true,
                  render: (value) => value.toLocaleString()
                },
                { 
                  key: 'engagement_rate', 
                  header: 'Reach Rate', 
                  align: 'right',
                  sortable: true,
                  render: (value) => (
                    <Badge 
                      variant={value >= 50 ? 'success' : value >= 25 ? 'warning' : 'default'}
                    >
                      {value.toFixed(1)}%
                    </Badge>
                  )
                },
              ]}
              data={analytics.widgetStats}
              hoverable
              compact
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-surface-400" />
              </div>
              <p className="text-surface-500">No widget data available yet</p>
              <p className="text-sm text-surface-400 mt-1">Create and publish widgets to see performance data</p>
            </div>
          )}
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Impressions Summary */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-brand-50">
                <Eye className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">Impressions Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-surface-100">
                <span className="text-surface-600">Total Impressions</span>
                <span className="font-semibold text-surface-900">{analytics.totalImpressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-100">
                <span className="text-surface-600">Unique Viewers</span>
                <span className="font-semibold text-surface-900">{analytics.uniqueViewers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-surface-600">Avg per Viewer</span>
                <div className="flex items-center gap-2">
                  <Sparkline 
                    data={[1, 2, 1.5, 3, 2.5, 4, 3.5]} 
                    width={60} 
                    height={20}
                    color="#6366f1"
                  />
                  <span className="font-semibold text-surface-900">
                    {analytics.uniqueViewers > 0 
                      ? (analytics.totalImpressions / analytics.uniqueViewers).toFixed(1)
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Engagement Summary */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-success-50">
                <Activity className="w-5 h-5 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900">Site Engagement</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-surface-100">
                <span className="text-surface-600">Avg Session Duration</span>
                <span className="font-semibold text-surface-900">{formatTime(analytics.avgTimeOnPage)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-100">
                <span className="text-surface-600">Bounce Rate</span>
                <span className={`font-semibold ${
                  analytics.bounceRate > 70 ? 'text-danger-600' : 
                  analytics.bounceRate > 50 ? 'text-warning-600' : 
                  'text-success-600'
                }`}>
                  {analytics.bounceRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-surface-600">Viewability Rate</span>
                <span className={`font-semibold ${
                  analytics.viewabilityRate > 50 ? 'text-success-600' : 
                  analytics.viewabilityRate > 25 ? 'text-warning-600' : 
                  'text-surface-600'
                }`}>
                  {analytics.viewabilityRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
