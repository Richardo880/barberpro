import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase no está configurado. Por favor, agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY a tus variables de entorno.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Lazy-loaded supabase client
export const supabase = {
  get storage() {
    return getSupabaseClient().storage;
  },
};

// Bucket names
export const STORAGE_BUCKETS = {
  RECORDS: 'records',
  SERVICES: 'services',
  STAFF: 'staff',
} as const;

// Helper to get public URL for a file
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = getSupabaseClient().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
