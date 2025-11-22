# Cart Activity Widget Fix

## Problem
Cart activity widget (and potentially other widgets) were not showing notifications even though events existed in the database.

## Root Cause
The `get-widget-notifications` Edge Function was querying the wrong column:
- Was checking: `.in('type', eventTypes)` ❌
- Should check: `.in('event_type', eventTypes)` ✅

The `events` table has both `type` and `event_type` columns, but `event_type` is the primary field where event tracking data is stored.

## Fix Applied
Updated line 267 in `supabase/functions/get-widget-notifications/index.ts`:

```typescript
// Before (BROKEN):
.in('type', eventTypes)

// After (FIXED):
.in('event_type', eventTypes)
```

## Deployment Status
✅ **Deployed successfully** to production

```
Deployed Functions on project ghiobuubmnvlaukeyuwe: get-widget-notifications
```

---

## Testing Steps

### 1. Check if Cart Events Exist
Run `CHECK_CART_EVENTS.sql` in Supabase SQL Editor to see if you have any `add_to_cart` events.

### 2. Create Test Events (if needed)
If no events exist, run `CREATE_TEST_CART_EVENT.sql` (remember to replace `YOUR_SITE_ID` with your actual site ID).

### 3. Verify Widget is Active
Make sure your cart activity widget is:
- ✅ Created
- ✅ Set to `is_active = true`
- ✅ Has the correct site_id
- ✅ Has event types set to `['add_to_cart']`

### 4. Test on Website
1. Refresh your website (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Wait 2-3 seconds
3. Cart activity notifications should now appear!

---

## How Cart Activity Works

### Event Flow
```
User adds item to cart
    ↓
Event tracked with event_type = 'add_to_cart'
    ↓
Stored in events table
    ↓
Edge Function queries event_type column (NOW FIXED!)
    ↓
Notifications generated and displayed
```

### Widget Configuration
- **Event Type**: `add_to_cart`
- **Time Window**: 2 hours (default)
- **Required Metadata**:
  - `customer_name` (or shows "Someone")
  - `product_name` (required)
  - `price` (optional, shown if available)
  - `location` (optional)

### Example Notification
```
🛒 John Doe
added Premium Plan to cart
• 5 minutes ago
```

---

## What This Fix Solves

This same fix applies to **ALL widget types**, including:
- ✅ Cart Activity (`add_to_cart`)
- ✅ Recent Purchases (`purchase`)
- ✅ Recent Signups (`signup`)
- ✅ Form Submissions (`form_submit`)
- ✅ Reviews (`review`)
- ✅ Page Views (`page_view`)
- ✅ Live Visitors (`visitor_active`)

---

## If Still Not Working

### Check Browser Console
Look for these logs:
```javascript
ProofPop: Fetched notifications: {...}
ProofPop: Total notifications queued: X
ProofPop: Showing notification: {...}
```

### Common Issues

1. **"No events found"**
   - Solution: Create test events using `CREATE_TEST_CART_EVENT.sql`

2. **"Widget not active"**
   - Solution: Check widget settings in dashboard, ensure `is_active = true`

3. **"Events too old"**
   - Solution: Cart activity default time window is 2 hours. Create fresh events or increase time window.

4. **"Wrong event_type"**
   - Solution: Ensure events have `event_type = 'add_to_cart'` (not just `type`)

5. **"Cache issue"**
   - Solution: Hard refresh (Ctrl+Shift+R) or clear browser cache

---

## Quick Verify Query

Run this to see if everything is set up correctly:

```sql
-- Check widget and events together
SELECT 
  w.id as widget_id,
  w.name as widget_name,
  w.is_active,
  (SELECT COUNT(*) 
   FROM events e 
   WHERE e.site_id = w.site_id 
     AND e.event_type = 'add_to_cart'
     AND e.timestamp > NOW() - INTERVAL '2 hours'
  ) as cart_events_last_2h
FROM widgets w
WHERE w.config->>'template_id' = 'cart_activity'
   OR w.name ILIKE '%cart%';
```

If `cart_events_last_2h` is 0, you need to create events.
If `is_active` is false, activate the widget.

---

## Support

If notifications still don't show after:
1. ✅ Fix is deployed (it is!)
2. ✅ Events exist with correct `event_type`
3. ✅ Widget is active
4. ✅ Hard refresh performed

Then check:
- Network tab for API calls to `/get-widget-notifications`
- Response payload to see what's being returned
- Browser console for JavaScript errors
