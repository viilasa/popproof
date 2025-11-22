# Analytics Dashboard

## Overview
A fully functional analytics dashboard that displays real-time metrics and historical data from your Supabase database.

## Features

### 📊 **Key Metrics Cards**
1. **Total Events** - All tracked events with trend indicator
2. **Total Impressions** - How many times notifications were shown
3. **Total Clicks** - User interactions with notifications
4. **Active Visitors** - Real-time count (last 30 minutes)

### 📈 **Interactive Chart**
- Daily breakdown of Events, Impressions, and Clicks
- Color-coded bars for easy visualization
- Responsive design with numeric labels

### 🎯 **Summary Cards**
- **Notifications Summary**: Created, impressions, and averages
- **Engagement Summary**: CTR, clicks, and events per visitor

### ⚙️ **Controls**
- **Site Selector**: Switch between different sites
- **Date Range**: 7, 30, or 90 days of data
- **Auto-refresh**: Click date range buttons to refresh

---

## Data Sources

The analytics pulls from these database tables:

1. **`events`** - All tracked user events
   - Used for: Total events, daily stats, active visitors

2. **`event_notifications`** - Generated notifications
   - Used for: Impressions, clicks, notification counts

3. **`sites`** - User sites
   - Used for: Site filtering and selection

---

## Metrics Explained

### Total Events
- All events tracked on your site (page views, purchases, etc.)
- Shows trend vs. previous period
- Green arrow ↑ = growth, Red arrow ↓ = decline

### Total Impressions
- Number of times notifications were displayed to visitors
- Pulled from `impression_count` in `event_notifications`

### Total Clicks
- Number of times visitors clicked on notifications
- CTR (Click-Through Rate) = (Clicks / Impressions) × 100

### Active Visitors
- Unique sessions with activity in the last 30 minutes
- Real-time indicator (green pulse dot)

### Click Rate (CTR)
- Percentage of impressions that resulted in clicks
- Industry average: 2-5% (yours may vary)

---

## How to Use

### Access Analytics
1. Click **"Analytics"** in the sidebar
2. Select a site from the dropdown
3. Choose a date range (7, 30, or 90 days)

### Interpret the Data
- **Blue bars** = Events (user activity)
- **Purple bars** = Impressions (notification views)
- **Green bars** = Clicks (user engagement)

### Tips
- Compare different date ranges to spot trends
- Low CTR? Try A/B testing notification designs
- High impressions, low clicks? Review notification messaging
- Monitor active visitors for real-time traffic

---

## Technical Details

### Database Queries
```typescript
// Total events for a site
supabase.from('events')
  .select('*', { count: 'exact' })
  .eq('site_id', selectedSiteId)

// Impressions and clicks
supabase.from('event_notifications')
  .select('impression_count, click_count')
  .eq('site_id', selectedSiteId)

// Active visitors (last 30 min)
supabase.from('events')
  .select('session_id')
  .gte('created_at', thirtyMinutesAgo)
```

### Performance Optimizations
- Uses Supabase count queries (no data transfer)
- Groups daily stats client-side
- Minimal re-renders with proper state management

---

## Future Enhancements

Potential additions:
- [ ] Export data to CSV
- [ ] Custom date range picker
- [ ] Conversion funnel visualization
- [ ] Real-time dashboard (WebSocket)
- [ ] Comparison mode (period over period)
- [ ] Geographic breakdown
- [ ] Device/browser analytics
- [ ] Notification performance by type
- [ ] A/B test results

---

## Troubleshooting

### "No data available"
- Check if you have events in the database
- Verify the selected site has activity
- Try a longer date range (30 or 90 days)

### "Loading analytics..."
- Ensure you're connected to Supabase
- Check browser console for errors
- Verify RLS policies allow reading data

### Low numbers showing
- This is expected for new sites
- Install the tracking pixel on your site
- Wait for users to visit and interact

---

## Data Flow

```
User Activity on Site
    ↓
Events tracked via pixel
    ↓
Stored in 'events' table
    ↓
Notifications generated
    ↓
Stored in 'event_notifications'
    ↓
Analytics queries both tables
    ↓
Displayed on dashboard
```

---

## Access Location

**Path**: Sidebar → Analytics  
**Route**: `activeSection === 'analytics'`  
**Component**: `src/pages/Analytics.tsx`
