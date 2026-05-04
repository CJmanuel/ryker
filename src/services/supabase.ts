// src/services/supabase.ts
// Supabase initialization and service exports
import { createClient } from '@supabase/supabase-js';

// Supabase config from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export auth, database, and storage services
export const auth = supabase.auth;
export const db = supabase;
export const storage = supabase.storage;