
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_CONFIG = {
  url: 'https://gmsddebsqjjopriayqtb.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtc2RkZWJzcWpqb3ByaWF5cXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDYzNzUsImV4cCI6MjA4MjQyMjM3NX0.V3kp7FunVgZu8SqSUSHRlRUUxc56rCFgnlaknmiEUFI'
};

// This checks if the configuration is valid
export const isConfigured = 
  SUPABASE_CONFIG.url !== 'https://YOUR_PROJECT_ID.supabase.co' && 
  SUPABASE_CONFIG.key !== 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
