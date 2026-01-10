import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Usar Service Role Key para operaciones del servidor (bypass RLS)
  // Si no está disponible, usar Anon Key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase no está configurado. Por favor, agrega NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) a tus variables de entorno.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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
