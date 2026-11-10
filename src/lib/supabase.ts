import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isPlaceholder =
  !rawSupabaseUrl ||
  !rawSupabaseKey ||
  rawSupabaseUrl.includes('tu-proyecto.supabase.co') ||
  rawSupabaseKey.includes('tu-anon-key-aqui');

const supabaseUrl = isPlaceholder ? '' : rawSupabaseUrl;
const supabaseKey = isPlaceholder ? '' : rawSupabaseKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
