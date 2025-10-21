# 🔍 Troubleshooting 404 Errors

## 🎯 Quick Diagnosis

### **Step 1: Open test-functions-live.html**
This will test all your functions and show exactly which ones are working.

### **Step 2: Check Your Website's Console**
Look at the **exact URL** that's returning 404. It should be one of these:

1. `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader`
2. `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine`
3. `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widgets`
4. `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/verify-pixel`
5. `https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/track-event`

---

## 🚨 Common Issues:

### **Issue 1: Wrong URL in Pixel Code**
Your pixel code might be using the wrong URL.

**Check your website's HTML:**
```html
<!-- WRONG ❌ -->
<script src=".../pixel.js" ...></script>

<!-- CORRECT ✅ -->
<script src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" 
        data-site-id="1808e26c-e195-4fcf-8eb1-95a4be718b39" 
        async defer></script>
```

---

### **Issue 2: Functions Deployed But Not Live Yet**
Sometimes it takes 30-60 seconds for functions to be available after deployment.

**Solution:** Wait 1 minute and refresh your website.

---

### **Issue 3: CORS Issues**
The function might be deployed but CORS headers are missing.

**Check:** Look for CORS errors in console, not just 404.

---

### **Issue 4: Function Name Mismatch**
Your code might be calling a function with a different name.

**Check deployment output:**
```
Deploying Function: pixel-loader  ✅
Deploying Function: engine  ✅
Deploying Function: get-widgets  ✅
```

Make sure these match the URLs being called.

---

## 🧪 Manual Tests:

### **Test 1: Direct URL Test**
Open these URLs directly in your browser:

1. https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader
   - Should return JavaScript code
   
2. https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine
   - Should return JavaScript code
   
3. https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/get-widgets?site_id=1808e26c-e195-4fcf-8eb1-95a4be718b39
   - Should return JSON array

---

### **Test 2: Browser Console Test**
```javascript
// Test pixel-loader
fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader')
  .then(r => console.log('Status:', r.status, r.ok ? '✅' : '❌'))
  .catch(e => console.error('Error:', e));

// Test engine
fetch('https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/engine')
  .then(r => console.log('Status:', r.status, r.ok ? '✅' : '❌'))
  .catch(e => console.error('Error:', e));
```

---

### **Test 3: Check Deployment Status**
```bash
# List all deployed functions
npx supabase functions list
```

Should show:
```
pixel-loader
engine
get-widgets
verify-pixel
track-event
```

---

## 🔧 Fixes:

### **Fix 1: Redeploy Specific Function**
If one function is 404:
```bash
npx supabase functions deploy pixel-loader
npx supabase functions deploy engine
```

### **Fix 2: Check Function Exists**
```bash
# List files
dir supabase\functions
```

Should show:
```
pixel-loader/
engine/
get-widgets/
verify-pixel/
track-event/
_shared/
```

### **Fix 3: Update Pixel Code**
Make sure your website has the CORRECT pixel code:
```html
<script src="https://ghiobuubmnvlaukeyuwe.supabase.co/functions/v1/pixel-loader" 
        data-site-id="YOUR_ACTUAL_SITE_ID" 
        async defer></script>
```

---

## 📋 Debugging Checklist:

Run through this list:

- [ ] Functions deployed successfully (no errors)
- [ ] Wait 60 seconds after deployment
- [ ] Open test-functions-live.html - all tests pass
- [ ] Direct URL test in browser works
- [ ] Pixel code on website uses correct URL
- [ ] Pixel code has correct site_id
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Hard refresh website (Ctrl+F5)

---

## 🎯 Expected Results:

### **After Deployment:**
```bash
npx supabase functions deploy
# Should show:
✓ Deployed pixel-loader
✓ Deployed engine
✓ Deployed get-widgets
✓ Deployed verify-pixel
✓ Deployed track-event
```

### **In Browser:**
```
Status 200 for all function URLs
No 404 errors in console
ProofPop messages in console
Notification appears on page
```

---

## 🚨 Still 404?

### **Check These:**

1. **Project ID Correct?**
   - URL should have: `ghiobuubmnvlaukeyuwe`
   - Check in Supabase dashboard

2. **Functions in Right Location?**
   ```
   supabase/
     functions/
       pixel-loader/
         index.ts
       engine/
         index.ts
   ```

3. **Logged into Right Account?**
   ```bash
   npx supabase projects list
   # Should show your project
   ```

4. **Function Logs Show Errors?**
   - Check Supabase Dashboard → Functions → Logs

---

## 💡 Quick Win:

1. **Open test-functions-live.html**
2. **Click "Test All Functions"**
3. **See which ones are 404**
4. **Redeploy those specific ones**
5. **Test again**

---

**The test file will show you EXACTLY which function is failing!** 🚀
