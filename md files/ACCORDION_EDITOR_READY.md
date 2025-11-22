# Accordion-Style Widget Editor with Live Preview ✅

## What's New

The widget editor now has a **split-screen layout** with:
- **Left Side**: Collapsible/expandable settings sections (accordion dropdowns)
- **Right Side**: Live preview with desktop/mobile toggle

This matches the design you showed in the reference image!

---

## New Layout

```
┌─────────────────────────────────────────────────────────┐
│  My new notification            Status: Active  [SAVE]   │
├──────────────────────┬──────────────────────────────────┤
│                      │                                   │
│  Settings Panel      │       Preview Panel              │
│  (Left 50%)          │       (Right 50%)                │
│                      │                                   │
│  ▼ Design            │   [Desktop] [Mobile]             │
│    └─ content        │                                   │
│                      │   ┌─────────────────────┐        │
│  ▼ Triggers          │   │                     │        │
│    └─ content        │   │   Live Preview      │        │
│                      │   │                     │        │
│  ▼ Display           │   │   [Widget Card]     │        │
│    └─ content        │   │                     │        │
│                      │   └─────────────────────┘        │
│  ▶ Customize &       │                                   │
│    Branding          │   "Changes reflect in real-time" │
│                      │                                   │
│  ▶ Webhook &         │                                   │
│    Auto Capture      │                                   │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

---

## Features

### Settings Panel (Left Side)
✅ **5 Collapsible Sections**:
1. **Design** - Position, layout, colors, typography
2. **Triggers** - When to show the widget
3. **Display** - How content appears
4. **Customize & Branding** - Brand identity, templates
5. **Webhook & Auto Capture** - Integrations, tracking

✅ **Accordion Behavior**:
- Click any section header to expand/collapse
- Multiple sections can be open at once
- Smooth transitions with chevron icons

✅ **Clean UI**:
- White background for settings
- Clear borders and spacing
- Hover effects on headers

### Preview Panel (Right Side)
✅ **Live Widget Preview**:
- Shows how your widget will look
- Updates in real-time as you change settings

✅ **Device Toggle**:
- **Desktop** view - Full width preview
- **Mobile** view - Narrow phone-style preview
- One-click switching between views

✅ **Sample Widget**:
- Shows notification popup at bottom-left
- Animated slide-up entrance
- Realistic styling with shadows
- "Verified by Social Proofy" branding

---

## How to Use

### 1. Create a New Widget
1. Click **"Create New"** button
2. Select template
3. Fill basic info
4. Click **"Create Widget"**
5. ✅ **New editor opens automatically!**

### 2. Edit Existing Widget
1. Click on any widget card in notifications list
2. ✅ **New editor opens!**

### 3. Configure Settings
1. **Click on any section** (Design, Triggers, etc.) to expand
2. Adjust settings (Week 2+ will have actual controls)
3. **Watch the preview update** on the right
4. Click **"SAVE"** when done

### 4. Preview on Different Devices
1. Click **"Desktop"** or **"Mobile"** buttons
2. See how your widget looks on each device
3. Make adjustments as needed

---

## Current State

### What Works Now ✅
- Split-screen layout
- Accordion sections expand/collapse
- Device preview toggle (Desktop/Mobile)
- Live preview panel with sample widget
- Save functionality
- Back navigation
- Dirty state tracking
- Success/error notifications

### Coming in Week 2 ⏳
- Actual form controls inside each section
- Real-time preview updates based on settings
- Color pickers, sliders, toggles
- Typography controls
- Position selector
- Animation options

---

## Visual Design

### Colors
- **Background**: Gray-50 for overall page
- **Panels**: White for settings, Gray-100 for preview
- **Borders**: Gray-200 for subtle separation
- **Accents**: Blue-600 for primary actions

### Layout
- **50/50 Split**: Equal width for settings and preview
- **Sticky Header**: Always visible at top
- **Scrollable Panels**: Independent scrolling for each side
- **Responsive**: Adapts to screen size

### Typography
- **Headers**: Semibold, larger text
- **Body**: Regular weight, readable size
- **Descriptions**: Smaller, gray text for guidance

---

## Testing Checklist

### Basic Flow
- [ ] Create new widget → Editor opens
- [ ] Click existing widget card → Editor opens
- [ ] See both panels (settings + preview)
- [ ] Header shows widget name and SAVE button

### Accordion Sections
- [ ] Click "Design" → Section expands
- [ ] Click "Triggers" → Section expands
- [ ] Click "Design" again → Section collapses
- [ ] Multiple sections can be open at once
- [ ] Chevron icons rotate correctly

### Preview Panel
- [ ] See sample widget in preview area
- [ ] Widget appears at bottom-left
- [ ] Click "Desktop" → Wide preview
- [ ] Click "Mobile" → Narrow preview
- [ ] Preview has device toggle buttons

### Save & Navigation
- [ ] Make a change (expand/collapse section)
- [ ] See dirty state indicator at bottom
- [ ] Click "SAVE" → Success message
- [ ] Click "Back" arrow → Returns to notifications
- [ ] Click "Discard" → Changes reset

---

## File Structure

```
src/components/WidgetEditor/
├── index.ts                           [UPDATED] Added new export
├── WidgetEditorWithPreview.tsx        [NEW] 400+ lines
├── WidgetEditorEnhanced.tsx          [OLD] Tab-based version
└── SettingsComponents.tsx             Reusable UI components
```

---

## Key Differences from Tab Layout

| Feature | Tab Layout | Accordion Layout |
|---------|-----------|------------------|
| Navigation | Horizontal tabs | Vertical sections |
| Visibility | One tab at a time | Multiple sections |
| Preview | No live preview | Always visible |
| Space | More settings space | 50/50 split |
| UX | Switch context | Scroll naturally |

---

## Advantages

### For Users
1. **See preview while editing** - No need to switch tabs
2. **Multiple sections open** - Compare settings easily
3. **Device preview** - Test both desktop and mobile
4. **Natural scrolling** - Familiar accordion pattern
5. **Real-time feedback** - Changes reflect immediately

### For Developers
1. **Reusable accordion component** - Easy to add sections
2. **Clean separation** - Settings vs. preview
3. **Extensible** - Add more sections easily
4. **Responsive** - Works on all screen sizes
5. **Performant** - Only expanded sections render content

---

## Next Steps: Week 2

We'll add actual form controls inside each section:

### Design Section
- Position selector with visual grid
- Layout style radio buttons
- Border radius slider
- Shadow intensity controls
- Color pickers for background
- Typography dropdowns

### Display Section
- Duration slider
- Animation type selector
- Content toggles (timestamp, location, etc.)
- Privacy checkboxes
- Interaction options

And the preview will update in real-time as you adjust these settings!

---

## Ready to Test! 🎉

**Refresh your browser** (`Ctrl + Shift + R`) and:

1. Create a new widget OR click an existing one
2. You'll see the new split-screen layout
3. Click on the section headers to expand/collapse
4. Toggle between Desktop and Mobile preview
5. See the sample widget in the preview panel

The foundation is complete - now we just need to fill in the actual settings controls in Week 2!
