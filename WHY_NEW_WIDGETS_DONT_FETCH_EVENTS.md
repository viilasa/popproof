# Why New Widgets Don't Fetch Existing Events

## 🔍 **The Problem**

You delete an old widget and create a new one of the same type (e.g., Customer Reviews).

**Expected:** New widget fetches all the existing review events from the database.

**Actual:** New widget shows "No notifications found" even though events exist in DB.

---

## 🐛 **Root Cause**

When the Edge Function queries for events, it needs to know **what event types to look for**. 

### **How the Edge Function Works:**

```javascript
// Edge Function checks these in order:
1. widget.config.triggers.events.eventTypes  ← Usually NULL on new widgets!
2. widget.config.rules.eventTypes           ← Usually NULL on new widgets!
3. notification_rules table                  ← You probably don't have this
4. Default fallback: ['purchase', 'signup', 'form_submit']  ← Doesn't include 'review'!
```

### **The Issue:**

When you create a new widget through the UI:
- `widget.config` is often **empty** or **incomplete**
- `template_id` is **NULL**
- `eventTypes` array is **NULL**

Without these configurations, the Edge Function:
- Can't determine what events to query
- Falls back to defaults: `['purchase', 'signup', 'form_submit']`
- Doesn't include `'review'`, `'add_to_cart'`, or other custom types
- Returns 0 notifications!

---

## ✅ **The Fix**

### **Option 1: Run the Quick Fix SQL**

```sql
-- File: QUICK_FIX_WIDGET_CONFIG.sql
-- Sets proper template_id and eventTypes for your widgets
```

### **Option 2: Manual Fix in Database**

For each widget, ensure `config` has this structure:

```json
{
  "template_id": "customer_reviews",
  "triggers": {
    "events": {
      "eventTypes": ["review"]
    }
  },
  "rules": {
    "eventTypes": ["review"],
    "timeWindowHours": 168
  }
}
```

---

## 🎯 **Widget Types & Event Types**

| Widget Type | template_id | Event Types |
|-------------|-------------|-------------|
| **Customer Reviews** | `customer_reviews` | `["review"]` |
| **Cart Activity** | `cart_activity` | `["add_to_cart"]` |
| **Recent Purchases** | `recent_purchases` | `["purchase"]` |
| **Recent Signups** | `recent_signups` | `["signup"]` |
| **Form Submissions** | `form_submissions` | `["form_submit"]` |

---

## 🔧 **Why Events Don't Link to Widgets**

**Important:** Events in the database are **NOT** linked to specific widgets!

### **Database Schema:**

```sql
events table:
- id
- site_id         ← Links to site
- event_type      ← 'review', 'add_to_cart', etc.
- timestamp
- metadata
- NO widget_id!   ← Events don't belong to specific widgets!
```

### **How It Works:**

1. **Events are tracked** to the `site_id` with an `event_type`
2. **Widgets query** for events by `event_type`
3. **Multiple widgets** can show the same events!

Example:
```
events table:
┌────────────┬─────────┬─────────────┐
│ event_type │ site_id │ customer    │
├────────────┼─────────┼─────────────┤
│ review     │ site-1  │ John Doe    │
│ review     │ site-1  │ Jane Smith  │
│ add_to_cart│ site-1  │ Bob Wilson  │
└────────────┴─────────┴─────────────┘

Widget A (Customer Reviews):
- Queries: WHERE event_type = 'review'
- Gets: John Doe, Jane Smith

Widget B (Cart Activity):
- Queries: WHERE event_type = 'add_to_cart'
- Gets: Bob Wilson
```

---

## 🚀 **Verification Steps**

### **1. Check Widget Configuration:**

```sql
SELECT 
  name,
  config->>'template_id' as template,
  config->'triggers'->'events'->>'eventTypes' as event_types
FROM widgets
WHERE site_id = 'YOUR_SITE_ID'
  AND is_active = true;
```

**Good Result:**
```
name              | template          | event_types
------------------+-------------------+-------------
Customer Reviews  | customer_reviews  | ["review"]
Cart Activity     | cart_activity     | ["add_to_cart"]
```

**Bad Result (Broken):**
```
name              | template | event_types
------------------+----------+-------------
Customer Reviews  | NULL     | NULL       ← BROKEN!
```

### **2. Check Events Exist:**

```sql
SELECT 
  event_type,
  COUNT(*) as count
FROM events
WHERE site_id = 'YOUR_SITE_ID'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_type;
```

**Should see:**
```
event_type   | count
-------------+-------
review       | 5
add_to_cart  | 12
```

### **3. Test the Match:**

```sql
-- This simulates what the Edge Function does
SELECT 
  w.name as widget,
  COUNT(e.id) as matching_events
FROM widgets w
LEFT JOIN events e ON 
  e.site_id = w.site_id 
  AND e.event_type = ANY(
    SELECT jsonb_array_elements_text(
      (w.config->'triggers'->'events'->>'eventTypes')::jsonb
    )
  )
WHERE w.site_id = 'YOUR_SITE_ID'
  AND w.is_active = true
GROUP BY w.name;
```

**Good Result:**
```
widget            | matching_events
------------------+----------------
Customer Reviews  | 5             ← Found events!
Cart Activity     | 12            ← Found events!
```

**Bad Result:**
```
widget            | matching_events
------------------+----------------
Customer Reviews  | 0             ← No match!
```

---

## 💡 **Prevention: Widget Creation Best Practice**

When creating widgets through the UI, **always ensure** the configuration is saved with:

1. ✅ `template_id` set correctly
2. ✅ `triggers.events.eventTypes` array populated
3. ✅ `rules.eventTypes` array populated
4. ✅ `notification_time_range` set to reasonable value (e.g., 168 hours = 7 days)

---

## 🔄 **Common Scenarios**

### **Scenario 1: Deleted old widget, created new one**
**Problem:** Old widget had config, new one doesn't.
**Fix:** Run `QUICK_FIX_WIDGET_CONFIG.sql`

### **Scenario 2: Cloned a widget**
**Problem:** Clone might not copy all config fields.
**Fix:** Manually set `eventTypes` in config.

### **Scenario 3: Imported widget from another site**
**Problem:** `site_id` mismatch, or config structure different.
**Fix:** Update `site_id` and config to match.

### **Scenario 4: Changed widget type**
**Problem:** `eventTypes` still set to old type.
**Fix:** Update `template_id` and `eventTypes` to match new type.

---

## 📋 **Summary**

| Issue | Cause | Fix |
|-------|-------|-----|
| "No notifications" | Missing `eventTypes` in config | Set `config.triggers.events.eventTypes` |
| "Wrong events showing" | Wrong `eventTypes` value | Update to correct event type |
| "0 events but DB has data" | `event_type` mismatch | Ensure events use same `event_type` as widget expects |
| "Widget not appearing" | `is_active = false` or wrong `site_id` | Activate widget, verify `site_id` |

---

## ✅ **Final Checklist**

Before expecting a new widget to show notifications:

- [ ] Widget `is_active = true`
- [ ] Widget `site_id` matches your site
- [ ] Widget `config.template_id` is set (e.g., `'customer_reviews'`)
- [ ] Widget `config.triggers.events.eventTypes` is set (e.g., `["review"]`)
- [ ] Widget `config.rules.eventTypes` is set (e.g., `["review"]`)
- [ ] Widget `notification_time_range` is set (e.g., `168`)
- [ ] Events exist in DB with matching `event_type`
- [ ] Events `site_id` matches widget's `site_id`
- [ ] Events are within time window (not too old)

If all checkboxes are ✅ and it still doesn't work, hard refresh your website (Ctrl+Shift+R) to clear cache!

---

## 🎯 **Quick Commands**

**Diagnostic:**
```sql
-- Shows everything in one view
\i FIX_NEW_WIDGET_NO_NOTIFICATIONS.sql
```

**Quick Fix:**
```sql
-- Fixes all common issues
\i QUICK_FIX_WIDGET_CONFIG.sql
```

**Manual Fix Template:**
```sql
UPDATE widgets
SET config = jsonb_set(
  jsonb_set(
    config,
    '{template_id}',
    '"WIDGET_TYPE"'
  ),
  '{triggers,events,eventTypes}',
  '["EVENT_TYPE"]'::jsonb
)
WHERE id = 'WIDGET_ID';
```

---

**TL;DR:** New widgets need `config.triggers.events.eventTypes` set correctly to fetch existing events from the database. Run `QUICK_FIX_WIDGET_CONFIG.sql` to fix it! 🎉
