# Google OAuth Error Fix - "Database error saving new user"

## Error You're Seeing
```
http://localhost:5173/?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

## Root Cause
Supabase can authenticate the user with Google, but cannot save their profile to the database due to:
- Missing database tables
- Missing Row Level Security (RLS) policies
- Missing triggers for automatic profile creation

---

## 🚀 Quick Fix Steps

### Step 1: Run the SQL Script

1. Open your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New query"**
5. Open the file `supabase_oauth_fix.sql` from your project root
6. Copy ALL the SQL code
7. Paste it into the Supabase SQL Editor
8. Click **RUN** (or press Ctrl+Enter)

**Expected Result:** You should see `"Google OAuth database setup completed successfully!"`

### Step 2: Verify Tables Were Created

1. Go to **Table Editor** in Supabase
2. You should see a `profiles` table
3. Click on it to verify the structure

### Step 3: Test Google Sign-In Again

1. Clear your browser cache or use incognito mode
2. Go to `http://localhost:5173`
3. Click **"Sign in with Google"**
4. Select your Google account
5. You should be redirected back and logged in successfully

---

## 🔍 Alternative Troubleshooting

### If the Above Doesn't Work:

#### Check 1: Verify Google OAuth is Enabled in Supabase

1. Go to **Authentication** > **Providers** in Supabase
2. Find **Google** provider
3. Make sure it's **ENABLED** (toggle should be ON)
4. Verify your Client ID and Client Secret are correct
5. Click **Save**

#### Check 2: Check Redirect URLs

Make sure your redirect URL in Google Console matches:
```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

Replace `YOUR_SUPABASE_PROJECT_REF` with your actual project reference.

#### Check 3: View Supabase Auth Logs

1. Go to **Authentication** > **Logs** in Supabase
2. Look for recent errors
3. Check what the actual error message says

#### Check 4: Test with Email/Password First

Try creating a regular account with email/password:
1. If that works → Database is fine, OAuth config is the issue
2. If that fails → Database schema needs fixing

---

## 📝 What the SQL Script Does

The script creates:

1. **`profiles` table** - Stores user profile information
2. **RLS Policies** - Allows users to read/write their own data
3. **Trigger Function** - Automatically creates a profile when a new user signs up
4. **Auth Trigger** - Runs the function whenever a user is created via Google OAuth

---

## 🆘 Still Having Issues?

### Error: "relation 'profiles' already exists"
- **Solution**: The table already exists. Check if RLS policies are enabled.

### Error: "permission denied"
- **Solution**: Make sure you're running the SQL as the database owner. Go to **SQL Editor** and run as default role.

### Error: "function already exists"
- **Solution**: The script has `DROP ... IF EXISTS` statements, so this shouldn't happen. If it does, manually drop the function first.

---

## ✅ Success Checklist

After running the fix, verify:
- [ ] SQL script ran without errors
- [ ] `profiles` table exists in Table Editor
- [ ] RLS is enabled on `profiles` table
- [ ] Trigger `on_auth_user_created` exists
- [ ] Google OAuth provider is enabled
- [ ] You can sign in with Google successfully

---

## 🔐 Security Note

The RLS policies ensure:
- Users can only see their own profile
- Users can only update their own profile
- Automatic profile creation is secure

This is the standard secure setup recommended by Supabase!

---

## Need More Help?

If you're still stuck:
1. Check Supabase dashboard logs under Authentication > Logs
2. Open browser DevTools and check Console for errors
3. Verify your `.env` file has correct Supabase credentials
4. Try signing out completely and clearing browser cache

Good luck! 🚀
