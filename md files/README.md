# Social Proof Widget System

A complete social proof notification system with a REST API backend and lightweight JavaScript widget for displaying real-time social proof events on any website.

## Authentication System

The application includes a comprehensive authentication system with the following features:

### Security Features
- **Secure Password Hashing**: Uses Supabase's built-in bcrypt hashing
- **Password Strength Validation**: Enforces strong passwords (8+ chars, mixed case, numbers, symbols)
- **Rate Limiting**: Prevents brute force attacks (5 attempts per 15 minutes)
- **Session Management**: Secure JWT token-based authentication via Supabase
- **CSRF Protection**: Built into Supabase's authentication system
- **Input Validation**: Client and server-side validation for all forms

### User Interface
- **Login Form**: Email/password authentication with error handling
- **Registration Form**: Account creation with real-time password strength indicator
- **Password Reset**: Forgot password functionality with email verification
- **User Profile**: Account management and password updates
- **Responsive Design**: Mobile-friendly authentication forms

### Authentication Flow
1. **Registration**: Users create accounts with email verification
2. **Login**: Secure authentication with rate limiting
3. **Session Management**: Automatic token refresh and logout
4. **Password Reset**: Email-based password recovery
5. **Profile Management**: Users can update their information and passwords

### Technical Implementation
- **React Context**: Global authentication state management
- **Protected Routes**: AuthGuard component for route protection
- **Supabase Integration**: Leverages Supabase Auth for backend security
- **TypeScript**: Full type safety for authentication flows
- **Error Handling**: Comprehensive error messages and user feedback

## Features

- **Lightweight Widget** (<10KB) with smooth animations
- **Real-time Notifications** fetched every 30 seconds
- **REST API** with proper validation and error handling
- **Database Storage** with Supabase and proper indexing
- **Non-intrusive Design** with glassmorphism effects
- **Mobile Responsive** with touch-friendly interactions
- **Easy Integration** with single script tag

## API Endpoints

### POST /add-event
Add a new social proof event to the database.

**Required Fields:**
- `client_id` (string) - Unique identifier for your website
- `event_type` (string) - Type of event (purchase, signup, download, etc.)
- `user_name` (string) - Name of the user who performed the action

**Optional Fields:**
- `product_name` (string) - Product involved in the event
- `location` (string) - User's location
- `value` (number) - Monetary value or quantity
- `timestamp` (string) - ISO 8601 timestamp (defaults to current time)

**Example Request:**
```bash
curl -X POST http://localhost:54321/functions/v1/add-event \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your-client-id",
    "event_type": "purchase",
    "user_name": "John Doe",
    "product_name": "Premium Plan",
    "location": "New York, USA",
    "value": 29.99
  }'
```

### GET /get-events
Retrieve recent social proof events for a specific client.

**Parameters:**
- `client_id` (required) - Your unique client identifier
- `limit` (optional) - Number of events to return (default: 10, max: 50)

**Example Request:**
```bash
curl "http://localhost:54321/functions/v1/get-events?client_id=your-client-id&limit=10"
```

## Widget Integration

### Simple Integration (Recommended)

Add the following script tag to your website to enable social proof notifications:

```html
<script async src="https://your-domain.com/pixel/your-client-id"></script>
```

This simplified approach uses a URL path parameter for the client ID, making it cleaner and more similar to other popular tracking pixels.

### Advanced Integration

If you need more control, you can use the traditional approach with data attributes:

```html
<script 
  async
  src="https://your-domain.com/widget-core.js" 
  data-client-id="your-client-id"
  data-api-url="https://your-api-domain.com/functions/v1">
</script>
```

## Development Setup

1. **Database Setup** (Supabase required):
   ```bash
   # The migration will be automatically applied
   # Make sure to click "Connect to Supabase" button in Bolt
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server** (React frontend):
   ```bash
   npm run dev
   ```

4. **Start Express Server** (for pixel integration):
   ```bash
   npm run server
   ```
   This server handles the `/pixel/:clientId` route for the simplified pixel integration.

5. **View Demo**:
   - Open `http://localhost:5173/demo.html` to see the widget in action with Vite.
   - Or open `http://localhost:3000/test-pixel.html` to test with Express server.

## Widget Behavior

- **Fetch Interval**: Retrieves new events every 30 seconds
- **Display Duration**: Shows each notification for 5 seconds
- **Max Notifications**: Displays up to 3 concurrent notifications
- **Event Filter**: Only shows events from the last 24 hours
- **Error Handling**: Fails silently on API errors
- **Responsive**: Adapts to mobile screens automatically

## Database Schema

The `social_proof_events` table includes:
- `id` (uuid, primary key)
- `client_id` (text, indexed)
- `event_type` (text)
- `user_name` (text)
- `product_name` (text, optional)
- `location` (text, optional)
- `value` (numeric, optional)
- `timestamp` (timestamptz, indexed)
- `created_at` (timestamptz)

## Security Features

- **Row Level Security** (RLS) enabled on all tables
- **Input validation** for all API endpoints
- **CORS support** for cross-origin requests
- **Rate limiting** ready (can be implemented at the edge)
- **SQL injection protection** through parameterized queries

## Customization

### Widget Styling
The widget uses CSS custom properties that can be overridden:

```css
.sp-widget-container {
  --sp-primary-color: #3B82F6;
  --sp-success-color: #10B981;
  --sp-background: rgba(255, 255, 255, 0.95);
  --sp-border-radius: 12px;
}
```

### Event Types
Common event types and their default messages:
- `purchase` / `bought` → "just made a purchase"
- `signup` / `registered` → "just signed up"  
- `download` → "just downloaded"
- `view` / `viewed` → "is viewing"

## Performance Considerations

- **Lightweight**: Widget is under 10KB minified
- **Efficient**: Only fetches new events, not duplicates
- **Indexed**: Database queries use proper indexes
- **Cached**: Browser caches widget for subsequent visits
- **Progressive**: Gracefully handles offline scenarios

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari 12+, Chrome Mobile 60+)

## License

MIT License - feel free to use in commercial projects.