# 🧪 ProofPop Widget Tester

A comprehensive e-commerce testing environment for all ProofPop widget types.

## 🎯 Purpose

This is a single-page application designed to test all ProofPop notification widgets in a realistic e-commerce environment. It simulates a complete online store with products, reviews, forms, and user interactions.

## 🚀 Features

### **Tested Widget Types:**

1. **🛍️ Purchase Notifications**
   - Test with "Buy Now" buttons on products
   - Tracks customer name, product, price, and location

2. **🛒 Cart Activity**
   - Test with "Add to Cart" buttons
   - Shows real-time cart additions

3. **📝 Form Submissions**
   - Contact form (auto-tracked)
   - Newsletter signup form
   - Captures name and email

4. **👤 New Signups**
   - Newsletter subscription form
   - Manual test button available

5. **⭐ Customer Reviews**
   - Review submission form
   - Star ratings (1-5 stars)
   - Auto-displays submitted reviews

6. **👥 Live Visitor Count**
   - Simulated active visitor counter
   - Updates dynamically

7. **📊 Active Sessions**
   - Page view tracking
   - Real-time activity monitoring

## 🎨 Design

- **Modern, Clean UI** - Professional e-commerce design
- **Gradient Colors** - Beautiful purple/blue gradients
- **Responsive Layout** - Works on all devices
- **Smooth Animations** - Professional transitions and effects
- **Test Controls Panel** - Floating panel with quick test buttons

## 📁 Files

```
test-pages/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling
├── test-script.js      # All testing functionality
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

## 🌐 Deployment

### **Deploy to Vercel:**

1. **Install Vercel CLI (if not installed):**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to test-pages folder:**
   ```bash
   cd test-pages
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy: Yes
   - Project name: `proofpop-widget-tester`
   - Directory: `./`
   - Settings: Use defaults

5. **Production deployment:**
   ```bash
   vercel --prod
   ```

### **Alternative: Deploy via Vercel Dashboard:**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import the `test-pages` folder
4. Deploy!

## 🧪 How to Test

### **Method 1: Using the Page Naturally**

1. **Visit the deployed page**
2. **Click "Buy Now"** on any product → Triggers purchase widget
3. **Click "Add to Cart"** → Triggers cart activity widget
4. **Fill out contact form** → Auto-tracked by pixel
5. **Submit newsletter signup** → Triggers signup widget
6. **Submit a review** → Triggers review widget

### **Method 2: Using Test Controls**

1. **Click the "🧪 Test Controls" button** (bottom-right)
2. **Use quick test buttons:**
   - Test Purchase
   - Test Add to Cart
   - Test Signup
   - Test Review
   - Test Form Submit
   - Simulate Visitors

### **Method 3: Browser Console**

Open console (F12) and run:

```javascript
// Test purchase
testPurchase('Pro Plan', 99);

// Test cart
testAddToCart('Starter Plan', 29);

// Test signup
testSignup();

// Test review
testReview();

// Test form submission
testFormSubmit();

// Simulate visitors
simulateVisitors();
```

## 📊 Features

### **Live Statistics**
- **Visitor Count** - Updates in real-time
- **Purchase Count** - Tracks test purchases
- **Signup Count** - Tracks new signups
- **Cart Items** - Current cart count

### **Event Log**
- Shows last 10 events
- Timestamped entries
- Event type and details
- Scrollable history

### **Random Data Generation**
- 14 first names
- 10 last names
- 15 cities worldwide
- Realistic test scenarios

### **localStorage Persistence**
- Stats persist across page reloads
- Can be cleared with "Clear Stats" button

## 🎨 Customization

### **Change Site ID:**

In `index.html`, update the ProofPop script tags:

```html
<script data-site-id="YOUR-SITE-ID" src="..."></script>
<script src="...?site_id=YOUR-SITE-ID"></script>
```

### **Add More Products:**

Copy a `.product-card` div in `index.html` and modify:
- Product name
- Description
- Features
- Price
- Icon emoji

### **Customize Colors:**

In `styles.css`, change the gradient colors:

```css
background: linear-gradient(135deg, #YOUR-COLOR-1 0%, #YOUR-COLOR-2 100%);
```

## 🔍 What to Watch For

### **Console Messages:**

✅ **Success Messages:**
```
ProofPop Widget Engine v2.0 Loaded
ProofPop: Fetched notifications: {...}
ProofPop Ready
```

❌ **Error Messages:**
```
401 (Unauthorized) - Fix: Check authentication
Failed to fetch - Fix: Check network/CORS
ProofPop not loaded - Fix: Check pixel installation
```

### **Network Tab:**

Check these requests succeed:
- `/pixel-loader` - 200 OK
- `/engine` - 200 OK
- `/track-event` - 200 OK
- `/get-widget-notifications` - 200 OK

### **Notifications Display:**

After triggering events:
1. Wait 30 seconds
2. Refresh page (Ctrl+Shift+R)
3. Notification should appear bottom-left after 2 seconds
4. Cycles through all tracked events

## 🐛 Troubleshooting

### **No notifications appearing:**

1. Check console for errors
2. Verify site_id is correct
3. Check widgets are active in dashboard
4. Wait 30 seconds after creating event
5. Hard refresh (Ctrl+Shift+R)

### **401 Unauthorized:**

- Function needs authentication
- Check if anon key is correct
- Verify function is deployed

### **Widgets not loading:**

- Check network tab for failed requests
- Verify pixel-loader and engine are deployed
- Check browser cache (try incognito)

### **Events not saving:**

- Check track-event function logs
- Verify database connection
- Check RLS policies

## 📝 Notes

- **Test Environment Only** - Not for production use
- **All Events are Test Data** - No real transactions
- **Statistics Reset** - Use "Clear Stats" button
- **Cache Issues** - Use hard refresh (Ctrl+Shift+R)

## 🎯 Testing Checklist

- [ ] Deploy to Vercel
- [ ] Visit deployed URL
- [ ] Check console for "ProofPop Ready"
- [ ] Test purchase widget
- [ ] Test cart widget
- [ ] Test form submission
- [ ] Test signup widget
- [ ] Test review widget
- [ ] Test visitor simulation
- [ ] Verify notifications appear
- [ ] Check event log
- [ ] Test on mobile
- [ ] Test all buttons
- [ ] Clear stats and retest

## 🚀 Future Enhancements

Potential additions:
- [ ] Multiple page navigation
- [ ] User authentication flow
- [ ] Shopping cart checkout
- [ ] Product detail pages
- [ ] Search functionality
- [ ] Filters and sorting
- [ ] Wishlist feature
- [ ] Compare products

## 📞 Support

If you encounter issues:
1. Check console logs
2. Verify widget configuration in dashboard
3. Test with browser dev tools open
4. Check network requests

---

**Built for comprehensive ProofPop widget testing** 🧪

Test all widgets in one place! 🎉
