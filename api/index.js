const { supabase } = require('./_supabase');

// Simple helper untuk mem-parsing body
async function parseBody(req) {
  if (typeof req.body === 'object') return req.body;
  try {
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    return JSON.parse(bodyStr || '{}');
  } catch (e) {
    return {};
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // CORS jika dibutuhkan
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('app_settings').select('settings').eq('id', 1).single();
      if (error) {
         return res.status(200).json({ 
           _debug_error: error, 
           _debug_url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'fallback_used' 
         });
      }
      return res.status(200).json(data ? data.settings : {});
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      await supabase.from('app_settings').upsert({ id: 1, settings: body }, { onConflict: 'id' });
      return res.status(200).json(body);
    }
  }

  // --- LOGIN ---
  if (pathname === '/api/login' && req.method === 'POST') {
    const body = await parseBody(req);
    // Hardcode sederhana karena ini prototipe, atau cek ke tabel users
    if ((body.username === 'owner' || body.username === 'admin') && body.password === 'owner123') {
      // Set dummy cookie
      res.setHeader("Set-Cookie", `session_token=admin_token; HttpOnly; Path=/; Max-Age=86400`);
      return res.status(200).json({ success: true, user: { role: 'owner', name: 'Admin Dapur Senja' } });
    }
    return res.status(401).json({ error: "Username atau password salah." });
  }

  // --- ME ---
  if (pathname === '/api/me' && req.method === 'GET') {
    const cookies = req.headers.cookie || '';
    if (cookies.includes('session_token=')) {
      return res.status(200).json({ user: { role: 'owner', name: 'Admin Dapur Senja' } });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }

  // --- SERVICES / MENU ---
  if (pathname === '/api/services') {
    if (req.method === 'GET') {
      const { data } = await supabase.from('services').select('*');
      return res.status(200).json({ services: data || [] });
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      await supabase.from('services').upsert(body, { onConflict: 'id' });
      return res.status(200).json({ success: true });
    }
  }

  // --- TRANSACTIONS ---
  if (pathname === '/api/transactions') {
    if (req.method === 'GET') {
      const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20);
      return res.status(200).json({ transactions: data || [], summary: { totalTransactions: data ? data.length : 0 } });
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const transaction = {
        id: `trx_${Date.now()}`,
        invoice_number: `INV-${Date.now()}`,
        customer_name: body.customerName || "Pelanggan",
        items: body.items || [],
        status: "Memasak",
        created_at: new Date().toISOString()
      };
      await supabase.from('transactions').insert(transaction);
      return res.status(201).json({ transaction });
    }
  }

  // Fallback
  return res.status(404).json({ error: "Route not found in Serverless API" });
}
