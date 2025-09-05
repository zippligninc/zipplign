import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging to help identify the issue
console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

// Check if we're in the browser and environment variables are available
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error("Supabase URL and/or anonymous key are not defined");
  console.error("URL:", supabaseUrl);
  console.error("Key:", supabaseAnonKey ? 'Present' : 'Missing');
  // Don't throw error in browser, just log it
}

// Only create client if we have the required environment variables
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
