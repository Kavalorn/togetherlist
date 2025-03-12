import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const AnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Створення клієнта для використання на сервері
export const createSupabaseServerClient = () => 
  createClient(supabaseUrl, supabaseAnonKey);

// Створення клієнта для використання на клієнті
export const createSupabaseClient = () => 
  createClient(supabaseUrl, AnonKey);