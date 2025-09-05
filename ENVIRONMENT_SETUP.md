# Environment Setup Guide

## Required Environment Variables

To fix the "Error fetching zippclips" issue, you need to set up your Supabase environment variables.

### Step 1: Create Environment File

Create a file named `.env.local` in the root directory of your project with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 2: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Example Configuration

Your `.env.local` file should look like this:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwc3JpbXRzYnFxZ2psZWNoZGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2...
```

### Step 4: Restart Development Server

After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## Troubleshooting

If you're still seeing the error after setting up environment variables:

1. **Check the browser console** - You should now see more detailed error messages
2. **Verify database setup** - Make sure your Supabase database has the `zippclips` table
3. **Check table permissions** - Ensure your database policies allow reading from the `zippclips` table

## Database Schema

Make sure your `zippclips` table has the following columns:
- `id` (uuid, primary key)
- `description` (text)
- `media_url` (text)
- `media_type` (text)
- `likes` (integer)
- `comments` (integer) 
- `saves` (integer)
- `shares` (integer)
- `song` (text)
- `song_avatar_url` (text)
- `user_id` (uuid, foreign key to profiles table)
- `created_at` (timestamp)
