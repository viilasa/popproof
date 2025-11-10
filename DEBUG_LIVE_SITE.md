# Debug Live Site - Design Settings Not Applying

## Quick Checks

### 1. Check if widget.js is Updated on Live Site

Open your live website and check browser console:

```javascript
// Paste this in browser console on your live site
fetch('https://yourdomain.com/widget.js')
  .then(r => r.text())
  .then(code => {
    console.log('Has fetchWidgetConfig?', code.includes('fetchWidgetConfig'));
    console.log('Has applyDesignStyles?', code.includes('applyDesignStyles'));
  });
```

**Expected:** Both should be `true`  
**If false:** Widget.js on live site is outdated

---

## Problem: widget.js Not Updated on Live Site

The `public/widget.js` file was updated locally, but your live website is still serving the old version.

### Where is widget.js served from?

Check your pixel code on the live site. Look for:
```html
<script async src="???" data-client-id="..."></script>
```

The `src` URL tells us where widget.js is loaded from.

---

## Solution Options:

### Option 1: Widget.js Served from Your Dashboard (localhost:3173)

**If pixel code has:**
```html
<script src="http://localhost:3173/widget.js" ...>
```

**Problem:** This only works during development!

**Fix:** You need to host widget.js somewhere accessible:
- Upload to your website's server
- Use a CDN
- Host on Netlify/Vercel
- Use Supabase Storage

---

### Option 2: Widget.js Hosted on Your Website

**If pixel code has:**
```html
<script src="https://yoursite.com/widget.js" ...>
```

**You need to:**
1. Upload the new `widget.js` file to your website
2. Replace the old file
3. Clear cache (if using CDN)
4. Hard refresh browser

**Steps:**
```bash
# Copy the updated file
cp public/widget.js /path/to/your/website/public/

# Then on live site, hard refresh
Ctrl + Shift + R
```

---

### Option 3: Use Supabase Storage

Host widget.js on Supabase Storage for easy updates:

**Steps:**

1. Upload widget.js to Supabase Storage:
```bash
# Create a bucket called 'widgets' (public)
# Upload public/widget.js to the bucket
```

2. Get public URL:
```
https://ghiobuubmnvlaukeyuwe.supabase.co/storage/v1/object/public/widgets/widget.js
```

3. Update pixel code to use this URL:
```html
<script async 
  src="https://ghiobuubmnvlaukeyuwe.supabase.co/storage/v1/object/public/widgets/widget.js"
  data-client-id="YOUR_KEY"
  data-api-url="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1">
</script>
```

---

## Debug on Live Site

### Test 1: Check if Config is Being Fetched

On your live website, open browser console and type:
```javascript
window.addEventListener('proofpop:ready', (e) => {
  console.log('Widget ready:', e.detail);
});
```

Then reload the page. You should see the event.

### Test 2: Check Widget Config

Add this to your live site console:
```javascript
// Wait 2 seconds for widget to initialize
setTimeout(() => {
  // This won't work directly, but you can add debug code to widget.js
  console.log('Check Network tab for get-widget-config call');
}, 2000);
```

**In Network tab:**
- Look for request to `get-widget-config`
- Check if it returns 200 OK
- Check the response has config data

### Test 3: Manual Config Test

Test if the API works:
```bash
curl "https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widget-config?client_id=YOUR_PUBLIC_KEY"
```

Replace `YOUR_PUBLIC_KEY` with your site's public key.

**Expected response:**
```json
{
  "success": true,
  "config": {
    "design": {
      ...
    }
  }
}
```

---

## Most Likely Issue

**The widget.js file on your live website is the OLD version.**

### Quick Fix:

1. **Find where widget.js is hosted**
   - Check pixel code `<script src="...">` 
   - Is it localhost? That won't work on live site!

2. **Upload new widget.js**
   - Copy `public/widget.js` from your project
   - Upload to your website or CDN
   - Make sure it replaces the old file

3. **Clear cache**
   - Browser cache: `Ctrl + Shift + R`
   - CDN cache: Purge/flush cache
   - Server cache: Restart if needed

4. **Test again**
   - Open live site in incognito mode
   - Check browser console for errors
   - Look for `get-widget-config` in Network tab

---

## Where Should widget.js Be Hosted?

For production, widget.js should be:
- ✅ On a CDN (Cloudflare, AWS CloudFront)
- ✅ On your website's server
- ✅ On Supabase Storage (public bucket)
- ✅ On Netlify/Vercel static hosting

**NOT:**
- ❌ On localhost
- ❌ On your development machine

---

## Recommended Setup

### 1. Create Supabase Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `widgets`
3. Make it **public**
4. Upload `widget.js`

### 2. Update Pixel Code

Change this:
```html
<script src="http://localhost:3173/widget.js" ...>
```

To this:
```html
<script async 
  src="https://ghiobuubmnvlaukeyuwe.supabase.co/storage/v1/object/public/widgets/widget.js"
  data-client-id="YOUR_PUBLIC_KEY"
  data-api-url="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1">
</script>
```

### 3. Future Updates

When you update widget.js:
1. Upload new version to Supabase Storage (overwrite old file)
2. Users will get updated version on next page load
3. No code changes needed on their end

---

## What to Check Right Now

1. **Open your live website**
2. **Open browser DevTools (F12)**
3. **Go to Network tab**
4. **Reload page**
5. **Find the widget.js request**
6. **Check the URL it's loading from**

**Tell me what URL it shows!**

That will help me know exactly what's wrong.

---

## Quick Test Commands

Run these in your live site's browser console:

```javascript
// Test 1: Check widget.js source
console.log('Widget script src:', 
  document.querySelector('[data-client-id]')?.src
);

// Test 2: Wait for widget ready
window.addEventListener('proofpop:ready', (e) => {
  console.log('✅ Widget initialized');
});

// Test 3: Check for API calls
// (Look in Network tab for 'get-widget-config')
```

---

## Summary

The edge function is deployed ✅  
The widget.js is updated ✅  
**BUT** your live site needs the NEW widget.js file!

**Action needed:** Upload the new widget.js to wherever your live site loads it from.

Let me know where your widget.js is currently hosted and I'll help you update it! 🚀
