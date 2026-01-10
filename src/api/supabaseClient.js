import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Save the session to localStorage
    autoRefreshToken: true, // IMPORTANT! Renew token before it expires
    detectSessionInUrl: true, // Helps with OAuth logins
  },
});
