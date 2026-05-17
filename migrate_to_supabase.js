const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Mengambil kredensial Supabase dari .env atau fallback
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lmgzsfivhdoczbgoshyu.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ3pzZml2aGRvY3piZ29zaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjU2NTQsImV4cCI6MjA5NDU0MTY1NH0.RxEztkIUOMtPDk90PrLbiKCitGA-5GlXAWWxiMxd36I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('Memulai sinkronisasi data dari komputer ke Supabase (Vercel)...');

  try {
    // 1. Migrasi Pengaturan (Settings)
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    const settingsRaw = await fs.readFile(settingsPath, 'utf8');
    const settingsData = JSON.parse(settingsRaw);
    
    console.log('Mengunggah pengaturan (settings)...');
    const { error: errSettings } = await supabase
      .from('app_settings')
      .upsert({ id: 1, settings: settingsData }, { onConflict: 'id' });
      
    if (errSettings) console.error('Gagal mengunggah pengaturan:', errSettings.message);
    else console.log('✅ Pengaturan berhasil disinkronkan!');

    // 2. Migrasi Menu (Services)
    const servicesPath = path.join(__dirname, 'data', 'services.json');
    const servicesRaw = await fs.readFile(servicesPath, 'utf8');
    const servicesData = JSON.parse(servicesRaw);

    if (servicesData && servicesData.length > 0) {
      console.log(`Mengunggah ${servicesData.length} menu makanan...`);
      for (const item of servicesData) {
        
        // Sesuaikan nama kolom (camelCase ke snake_case)
        if (item.turnaroundMinutes !== undefined) {
          item.turnaround_minutes = item.turnaroundMinutes;
          delete item.turnaroundMinutes;
        }

        const { error: errMenu } = await supabase
          .from('services')
          .upsert(item, { onConflict: 'id' });
        if (errMenu) console.error(`Gagal mengunggah ${item.name}:`, errMenu.message);
      }
      console.log('✅ Menu makanan berhasil disinkronkan!');
    }

    console.log('\nSINKRONISASI SELESAI!');
    console.log('Silakan buka ulang halaman website Vercel Anda, tampilannya seharusnya sudah sama dengan localhost!');

  } catch (error) {
    console.error('Terjadi kesalahan saat membaca file lokal:', error.message);
  }
}

migrateData();
