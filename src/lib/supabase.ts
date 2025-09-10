import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey) && process.env.NODE_ENV === 'development') {
  console.error("Supabase URL and/or anonymous key are not defined");
  console.error("URL:", supabaseUrl);
  console.error("Key:", supabaseAnonKey ? 'Present' : 'Missing');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
