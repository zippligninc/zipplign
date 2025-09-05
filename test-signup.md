# Signup Testing Guide

## Fixed Issues:
1. ✅ **Username Length**: Now requires 3+ characters (matches database constraint)
2. ✅ **Unique Usernames**: Automatically adds numbers if username exists
3. ✅ **Profile Creation**: Updated trigger to include username
4. ✅ **Better Error Handling**: Detailed console logging and user feedback
5. ✅ **Session Management**: Proper handling of missing session data

## Testing Steps:

### 1. **Update Database Schema**
Run the `clean-schema.sql` in your Supabase SQL Editor to fix any type mismatches.

### 2. **Test Signup Flow**
1. Go to `/signup`
2. Enter a valid email
3. Create a strong password (8-20 chars, letter+number+special char)
4. Enter a nickname (3+ characters)
5. Click "Sign Up"

### 3. **Check for Errors**
- Open browser DevTools → Console
- Look for detailed error messages
- Check Network tab for failed requests

### 4. **Common Issues & Solutions**

#### **Database Issues:**
- **Error**: "foreign key constraint failed"
- **Fix**: Run `clean-schema.sql` to fix type mismatches

#### **Username Issues:**
- **Error**: "username_length check constraint"
- **Fix**: Use 3+ character nicknames (now enforced in UI)

#### **Profile Creation Issues:**
- **Error**: "trigger function failed"
- **Fix**: Database trigger now includes username field

#### **Environment Issues:**
- **Error**: "Supabase client not available"
- **Fix**: Verify `.env.local` has correct credentials

### 5. **Success Indicators**
- ✅ Console shows: "Signup successful: [data]"
- ✅ Toast shows: "Account Created!"
- ✅ Redirects to email verification page
- ✅ New user appears in Supabase auth.users
- ✅ Profile created in profiles table

### 6. **Debugging Commands**

Check Supabase logs:
```sql
-- Check if user was created
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Check if profile was created
SELECT * FROM profiles ORDER BY updated_at DESC LIMIT 5;

-- Check for trigger errors
SELECT * FROM pg_stat_activity WHERE query LIKE '%handle_new_user%';
```
