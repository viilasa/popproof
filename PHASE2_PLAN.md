# 🎯 PHASE 2: Real Data Integration

## 📋 **Overview**

Transform the ProofPop system from mock data to **real-time event-driven notifications** using actual customer activities.

---

## 🎯 **Goals**

1. ✅ Replace mock notification data with real events
2. ✅ Auto-create notification widgets from events
3. ✅ Build notification rules engine (triggers, filters)
4. ✅ Real-time event processing
5. ✅ Display actual customer activities as social proof

---

## 📊 **Phase 2 Architecture**

```
Customer Action (purchase, signup, etc.)
    ↓
Pixel v3.0 tracks event
    ↓
track-event stores in events table
    ↓
Notification Rules Engine
    ↓
Create/Update notification widget
    ↓
Display on customer's website
```

---

## 🛠️ **Tasks**

### **Task 2.1: Event-to-Notification Transformer** 🔄

**Goal:** Convert raw events into displayable notifications

**What to Build:**
1. Edge function `transform-event`
2. Event type mappings (purchase → purchase notification)
3. Template generator
4. Priority scoring

**Event Types to Support:**
- `purchase` → "John just bought Premium Plan ($99)"
- `signup` → "Sarah signed up from New York"
- `form_submit` → "Mike submitted contact form"
- `review` → "Emma left a 5-star review"
- `add_to_cart` → "3 people are viewing this product"

**Output:** Structured notification ready for display

---

### **Task 2.2: Notification Rules Engine** ⚙️

**Goal:** Let users control which events become notifications

**Features:**
1. **Triggers:** What events to track
   - Event type (purchase, signup, etc.)
   - Value threshold ($50+)
   - Platform filter (Shopify only)
   - Time window (last 24 hours)

2. **Filters:** What to exclude
   - Test events
   - Low-value transactions
   - Specific URLs
   - User agents (bots)

3. **Display Rules:**
   - Show timing (immediately, delayed)
   - Display duration (5s, 10s)
   - Max displays per session
   - Geographic targeting

4. **Templates:**
   - Choose notification style
   - Customize text
   - Icon selection
   - Color scheme

**Implementation:**
- Database table: `notification_rules`
- Edge function: `process-event-rules`
- Dashboard UI: Rules editor

---

### **Task 2.3: Real-Time Event Feed** 📊

**Goal:** Show live events on dashboard as they happen

**Features:**
1. **Live Event Stream:**
   - Real-time event list
   - Event type badges
   - User details
   - Timestamp
   - Location

2. **Event Analytics:**
   - Events per hour chart
   - Event type breakdown
   - Conversion tracking
   - Top performing events

3. **Event Details:**
   - Click to see full event data
   - Session journey
   - Related events
   - Notification created (if any)

**Components:**
- `RecentEventsTable.tsx`
- `EventAnalytics.tsx`
- `EventDetailsModal.tsx`

---

### **Task 2.4: Auto-Create Widgets from Events** 🤖

**Goal:** Automatically generate notification widgets based on event patterns

**Smart Widget Creation:**
1. **Pattern Detection:**
   - Detect purchase events → Create "Recent Purchase" widget
   - Detect signups → Create "New Signup" widget
   - Detect reviews → Create "Customer Review" widget

2. **Auto-Configuration:**
   - Analyze event data structure
   - Set optimal display rules
   - Choose best template
   - Configure timing

3. **Widget Templates:**
   - Purchase notification
   - Signup notification
   - Review notification
   - Activity counter ("X people viewing")
   - Trust badges ("100+ customers")

4. **Suggestions:**
   - Recommend widgets based on events
   - Show potential impact
   - One-click activation

---

## 📊 **Database Schema Updates**

### **New Tables:**

```sql
-- Notification rules table
CREATE TABLE notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES widgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  
  -- Triggers
  event_types text[] NOT NULL,
  min_value numeric,
  max_value numeric,
  platforms text[],
  time_window_hours integer DEFAULT 24,
  
  -- Filters
  exclude_test_events boolean DEFAULT true,
  exclude_urls text[],
  exclude_user_agents text[],
  
  -- Display rules
  display_delay_seconds integer DEFAULT 0,
  display_duration_seconds integer DEFAULT 8,
  max_displays_per_session integer DEFAULT 5,
  geographic_targeting jsonb,
  
  -- Template
  template_id text,
  custom_template jsonb,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event-to-notification mapping
CREATE TABLE event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  widget_id uuid REFERENCES widgets(id) ON DELETE CASCADE,
  notification_data jsonb NOT NULL,
  displayed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notification analytics
CREATE TABLE notification_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id uuid REFERENCES widgets(id) ON DELETE CASCADE,
  event_notification_id uuid REFERENCES event_notifications(id),
  action_type text NOT NULL, -- 'view', 'click', 'close'
  session_id text,
  timestamp timestamptz DEFAULT now()
);
```

---

## 🔧 **Edge Functions to Create**

### **1. `transform-event`**
```typescript
// Converts event → notification
POST /functions/v1/transform-event
{
  event_id: "uuid",
  template: "purchase",
  options: {...}
}
→ Returns formatted notification
```

### **2. `process-event-rules`**
```typescript
// Processes new event through rules engine
POST /functions/v1/process-event-rules
{
  event: {...}
}
→ Creates notifications if rules match
```

### **3. `get-recent-events`**
```typescript
// Get recent events for dashboard
GET /functions/v1/get-recent-events?site_id=X&limit=50
→ Returns event list with analytics
```

### **4. `suggest-widgets`**
```typescript
// Analyze events and suggest widgets
POST /functions/v1/suggest-widgets
{
  site_id: "uuid",
  days: 7
}
→ Returns widget suggestions based on event patterns
```

---

## 🎨 **Dashboard Components to Build**

### **1. Real-Time Event Feed**
Location: `src/components/RecentEvents.tsx`

Shows:
- Live event stream
- Event type badges
- Customer names (anonymized)
- Locations
- Timestamps
- "Create Widget" button

### **2. Notification Rules Editor**
Location: `src/components/NotificationRulesEditor.tsx`

Features:
- Visual rule builder
- Event type selector
- Threshold inputs
- Filter configuration
- Template preview

### **3. Event Analytics Dashboard**
Location: `src/components/EventAnalytics.tsx`

Charts:
- Events per hour line chart
- Event type pie chart
- Conversion funnel
- Top events table

### **4. Widget Suggestions Panel**
Location: `src/components/WidgetSuggestions.tsx`

Shows:
- Recommended widgets
- Expected impact
- Quick setup
- Preview

---

## 🎯 **Success Metrics**

### **Phase 2 Complete When:**
1. ✅ Events automatically create notifications
2. ✅ Dashboard shows real event data (not mock)
3. ✅ Users can create notification rules
4. ✅ Widgets display real customer activities
5. ✅ Analytics show actual event metrics
6. ✅ System suggests widgets based on patterns

---

## 📈 **Implementation Order**

### **Week 1: Foundation**
- [x] Phase 1 Complete
- [ ] Task 2.1: Event transformer (Day 1-2)
- [ ] Database schema updates (Day 2)
- [ ] Basic real event display (Day 3)

### **Week 2: Rules Engine**
- [ ] Task 2.2: Notification rules (Day 4-5)
- [ ] Rules editor UI (Day 5-6)
- [ ] Rule processing engine (Day 7)

### **Week 3: Analytics & Auto-Creation**
- [ ] Task 2.3: Event feed (Day 8-9)
- [ ] Task 2.4: Auto-widget creation (Day 9-10)
- [ ] Widget suggestions (Day 10-11)

### **Week 4: Polish & Test**
- [ ] Testing with real data
- [ ] Performance optimization
- [ ] UI/UX refinements
- [ ] Documentation

---

## 🚀 **Starting Point: Task 2.1**

**First Thing to Build:**
1. Create `notification_rules` table
2. Create `transform-event` edge function
3. Update dashboard to fetch real events
4. Replace mock data with actual events

**Let's start with Task 2.1!** 🎯
