const { createClient } = require('@supabase/supabase-js');

// Gunakan environment variable Vercel atau fallback ke environment lokal (.env)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Peringatan: Kredensial Supabase tidak ditemukan di Environment Variables.");
}

const supabase = createClient(
  supabaseUrl || 'https://lmgzsfivhdoczbgoshyu.supabase.co', 
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ3pzZml2aGRvY3piZ29zaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NTQsImV4cCI6MjA5NDU0MTY1NH0.RxEztkIUOMtPDk90PrLbiKCitGA-5GlXAWWxiMxd36I'
);

module.exports = { supabase };
