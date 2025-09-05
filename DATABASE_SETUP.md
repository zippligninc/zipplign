# Database Setup Instructions

## Fix "Failed to fetch" Error

The "Failed to fetch" error you're seeing is because the database tables haven't been created yet. Follow these steps to fix it:

### Step 1: Apply Database Migrations

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/final_migrations.sql`
4. Click **Run** to execute the migration

### Step 2: Verify Tables Created

After running the migration, you should see these tables created:
- `creator_stores`
- `store_products` 
- `store_services`
- `saves`
- `drafts`
- `views` column added to `zippclips`

### Step 3: Test the Application

1. Refresh your application
2. Navigate to the **Store** page
3. The error should be gone and you should see an empty state (no stores yet)

### Step 4: Create Sample Data (Optional)

The migration script includes sample data creation, so you should see some test stores appear automatically.

## What the Migration Does

- Creates all necessary tables for the Creator Store functionality
- Sets up proper Row Level Security (RLS) policies
- Creates indexes for performance
- Adds sample data for testing
- Creates functions for view tracking

## Troubleshooting

If you still see errors after running the migration:

1. Check the Supabase logs for any SQL errors
2. Verify your environment variables are correct
3. Make sure you have the proper permissions in Supabase

The application will now work without the "Failed to fetch" error!
