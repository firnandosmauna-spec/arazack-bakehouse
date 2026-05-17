# Dapur Senja | Kuliner Rumahan Premium

Aplikasi web kuliner sederhana berbasis Node.js tanpa dependency eksternal, berisi:

- Landing page company profile restoran
- Daftar outlet aktif
- Login auth untuk owner dan kasir outlet
- Dashboard POS kuliner multi outlet
- Katalog menu makanan & minuman
- Pesanan tersimpan di JSON lokal
- MCP server lokal untuk auth, menu, dan transaksi

## Demo Login

- `owner` / `owner123`
- `yogyakarta` / `yogya123`
- `jakarta` / `jakarta123`

## Menjalankan

```bash
npm start
```

Lalu buka:

```text
http://localhost:3000 (atau port lain yang tersedia, cek di terminal)
```

## Struktur

- `src/server.js`: backend HTTP, session auth, endpoint publik, dan API POS
- `src/mcp/server.js`: MCP server lokal
- `src/mcp/core.js`: logika auth, menu, dan transaksi kuliner
- `public/`: landing page dan dashboard frontend
- `data/`: data user, outlet, menu, dan pesanan

## Catatan

Data masih memakai file JSON lokal agar mudah dikembangkan ke database sungguhan pada tahap berikutnya.
