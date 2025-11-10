# 🚀 Quick Deployment Guide - ProofPop Widget Tester

https://stunning-salamander-60bf35.netlify.app


## ⚡ Deploy to Vercel in 3 Steps

### **Step 1: Install Vercel CLI**

Open terminal/command prompt:

```bash
npm install -g vercel
```

---

### **Step 2: Navigate to test-pages folder**

```bash
cd c:\Users\surya\OneDrive\Desktop\poproofff\test-pages
```

---

### **Step 3: Deploy!**

```bash
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → `proofpop-widget-tester`
- **Directory?** → `.` (current directory)
- **Build Command?** → Leave empty (press Enter)
- **Output Directory?** → Leave empty (press Enter)
- **Development Command?** → Leave empty (press Enter)

**Done!** You'll get a URL like:
```
https://proofpop-widget-tester-xxx.vercel.app
```

---

### **Step 4: Make it Production**

```bash
vercel --prod
```

This gives you a permanent production URL!

---

## 🌐 Alternative: Deploy via Dashboard

### **If you prefer using the web interface:**

1. **Go to:** https://vercel.com/new

2. **Click "Add New Project"**

3. **Import Git Repository:**
   - Connect GitHub/GitLab
   - Or use Vercel CLI to push

4. **Or Upload Manually:**
   - Drag the `test-pages` folder
   - Click "Deploy"

---

## 🧪 After Deployment

### **Test Your Deployed Site:**

1. **Visit your Vercel URL**

2. **Check Console** (F12):
   ```
   ✅ ProofPop Widget Engine v2.0 Loaded
   ✅ ProofPop Ready
   ```

3. **Test Purchase:**
   - Click any "Buy Now" button
   - Check console: "Event tracked: purchase"
   - Wait 30 seconds
   - Refresh page
   - See notification appear! 🎉

4. **Test All Widgets:**
   - Use "🧪 Test Controls" button
   - Or interact naturally with page

---

## 📊 Expected Results

### **Immediate (After clicking button):**
- ✅ Success notification appears (green banner)
- ✅ Event logged in Test Controls panel
- ✅ Console shows: "Event tracked"

### **After 30 seconds + refresh:**
- ✅ ProofPop notification appears (bottom-left)
- ✅ Shows real customer data
- ✅ Cycles through multiple notifications

---

## 🎯 URLs You'll Get

### **Preview URL (first deployment):**
```
https://proofpop-widget-tester-xxx.vercel.app
```
- Generated automatically
- Updates with each push

### **Production URL (vercel --prod):**
```
https://proofpop-widget-tester.vercel.app
```
- Permanent URL
- Use this for sharing

---

## 🔧 Update Your Site

After making changes:

```bash
cd test-pages
vercel --prod
```

Vercel automatically detects changes and redeploys!

---

## 📱 Share Your Test Page

Send the URL to anyone to test widgets:
```
https://your-project.vercel.app
```

They can:
- See live notifications
- Test all widget types
- View event logs
- No setup required!

---

## 🎨 Customize Before Deploying

### **Change Your Site ID:**

Edit `index.html` lines 11-12:

```html
<!-- Replace with your site_id -->
<script data-site-id="YOUR-SITE-ID-HERE" src="..."></script>
<script src="...?site_id=YOUR-SITE-ID-HERE"></script>
```

### **Change Colors:**

Edit `styles.css` - search for:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Replace with your brand colors!

---

## ✅ Deployment Checklist

- [ ] Installed Vercel CLI
- [ ] Navigated to test-pages folder
- [ ] Ran `vercel` command
- [ ] Got preview URL
- [ ] Tested preview site
- [ ] Ran `vercel --prod` for production
- [ ] Shared production URL
- [ ] All widgets working!

---

## 🐛 Common Issues

### **"Command not found: vercel"**
**Fix:** Install Vercel CLI:
```bash
npm install -g vercel
```

### **"No package.json found"**
**Fix:** This is normal! The test page is static HTML. Just proceed.

### **"Vercel CLI needs to be updated"**
**Fix:** Update Vercel:
```bash
npm update -g vercel
```

### **Widgets not showing**
**Fix:** 
1. Check site_id in HTML
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console
4. Wait 30 seconds after event
5. Make sure widgets are active in dashboard

---

## 🎉 That's It!

Your widget tester is now live and accessible worldwide!

**Test URL:** `https://your-project.vercel.app`

**Share it, test it, and watch those notifications pop!** 🚀

---

## 📞 Need Help?

Check:
1. **README.md** - Complete documentation
2. **Browser console** - Error messages
3. **Vercel logs** - Deployment issues
4. **Network tab** - API requests

---

**Happy Testing!** 🧪✨
