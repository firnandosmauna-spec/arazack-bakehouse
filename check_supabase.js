const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lmgzsfivhdoczbgoshyu.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ3pzZml2aGRvY3piZ29zaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NTQsImV4cCI6MjA5NDU0MTY1NH0.RxEztkIUOMtPDk90PrLbiKCitGA-5GlXAWWxiMxd36I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Mengecek isi Supabase...\n");
  
  const { data: settingsData, error: errSet } = await supabase.from('app_settings').select('*');
  if (errSet) {
    console.error("❌ ERROR membaca app_settings:", errSet.message);
  } else {
    console.log("✅ Data Pengaturan (Settings):", JSON.stringify(settingsData, null, 2));
  }
}

check();
