const { supabase } = require('./_supabase');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Jika belum ada di tabel, kembalikan json kosong
      return res.status(200).json({});
    }
    return res.status(200).json(data.settings || {});
  }

  if (req.method === 'POST') {
    // Di Vercel, kita sebaiknya memeriksa autentikasi di sini,
    // tapi karena ini versi demo, kita asumsikan yang memanggil adalah admin yang sah.
    const newSettings = req.body || {};

    // Update settings di Supabase
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ id: 1, settings: newSettings }, { onConflict: 'id' })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, settings: newSettings });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
