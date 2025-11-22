# Toast Notification Component - Usage Guide

## Overview
A reusable toast notification system for displaying success, error, and warning messages.

## Features
- ✅ Auto-dismiss after 3 seconds (customizable)
- ✅ Manual close button
- ✅ Slide-in animation
- ✅ Three types: success, error, warning
- ✅ Clean, minimal design

---

## Usage

### Method 1: Using the `useToast` Hook (Recommended)

```tsx
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const { toast, success, error, warning, hideToast } = useToast();

  const handleAction = async () => {
    try {
      // Your logic here
      await saveData();
      success('Data saved successfully');
    } catch (err) {
      error('Failed to save data');
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Save</button>

      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={hideToast}
        duration={3000}
      />
    </div>
  );
}
```

### Method 2: Manual State Management

```tsx
import { useState } from 'react';
import { Toast } from '../components/Toast';

function MyComponent() {
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
  });

  const showSuccess = () => {
    setToast({
      isOpen: true,
      message: 'Action completed successfully!',
      type: 'success',
    });
  };

  return (
    <div>
      <button onClick={showSuccess}>Show Success</button>

      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        duration={3000}
      />
    </div>
  );
}
```

---

## Toast Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | required | The message to display |
| `type` | `'success' \| 'error' \| 'warning'` | required | Toast type |
| `isOpen` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Close handler |
| `duration` | `number` | `3000` | Auto-dismiss time in ms (0 = no auto-dismiss) |

---

## Hook API

### `useToast()`

Returns an object with:

```typescript
{
  toast: {
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
  },
  success: (message: string) => void,
  error: (message: string) => void,
  warning: (message: string) => void,
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void,
  hideToast: () => void,
}
```

### Quick Methods

```tsx
const { success, error, warning } = useToast();

// Success toast
success('Settings saved!');

// Error toast
error('Something went wrong');

// Warning toast
warning('Please review your input');
```

---

## Examples

### Form Submission

```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await submitForm(formData);
    success('Form submitted successfully');
  } catch (err) {
    error('Failed to submit form');
  }
};
```

### API Call

```tsx
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    success('Data loaded successfully');
  } catch (err) {
    error('Failed to load data');
  }
};
```

### Validation Warning

```tsx
const validateInput = () => {
  if (input.length < 5) {
    warning('Input must be at least 5 characters');
    return false;
  }
  return true;
};
```

---

## Styling

The toast appears in the **top-right corner** with:
- Success: Green background
- Error: Red background
- Warning: Yellow background

To customize position or styling, edit:
- `src/components/Toast.tsx` - Component structure
- `src/index.css` - Animation styles

---

## Currently Used In

- ✅ Account Settings page (`src/pages/Account.tsx`)
  - Success: Settings saved
  - Error: Failed to load/save

---

## Future Enhancements

- [ ] Multiple toasts queue
- [ ] Custom icons
- [ ] Click actions
- [ ] Different positions (top-left, bottom-right, etc.)
- [ ] Sound notifications
