# Google OAuth Setup Instructions

## Overview
This guide will help you configure Google OAuth authentication for your PopProof application.

## Prerequisites
- A Google Cloud Platform account
- Access to your Supabase project dashboard

## Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External (for public apps) or Internal (for organization only)
   - Fill in App name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
6. Select **Application type**: Web application
7. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourapp.com`)
8. Add **Authorized redirect URIs**:
   - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
   - Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference
9. Click **Create**
10. Save your **Client ID** and **Client Secret**

### 2. Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand
5. Enable the Google provider
6. Enter your **Client ID** and **Client Secret** from step 1
7. Click **Save**

### 3. Test the Integration

1. Start your development server
2. Go to the login page
3. Click "Sign in with Google"
4. Complete the Google authentication flow
5. You should be redirected back to your application and logged in

## Troubleshooting

### Common Issues

**"Invalid redirect URI"**
- Verify the redirect URI in Google Console matches your Supabase callback URL exactly
- Make sure there are no trailing slashes

**"OAuth consent screen not configured"**
- Complete the OAuth consent screen setup in Google Cloud Console
- Add all required information and scopes

**"Access blocked: Authorization Error"**
- Your app may need verification if using sensitive scopes
- For development, add test users in Google Console > OAuth consent screen

**User lands on login page after authentication**
- Check browser console for errors
- Verify Supabase project URL and keys are correct in your `.env` file

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for sensitive data
- Regularly rotate your OAuth credentials
- Review authorized domains and redirect URIs periodically

## Additional Resources

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
