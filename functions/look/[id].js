export async function onRequestGet(context) {
    const { params, env } = context;
    const lookId = params.id;
  
    try {
      // 1. Ambil data dari Cloudflare KV
      const looksData = await env.EUNOPHY_KV.get("looks", { type: "json" }) || {};
      const catalogData = await env.EUNOPHY_KV.get("catalog", { type: "json" }) || {};
  
      const look = looksData[lookId];
  
      // Jika Look ID tidak ditemukan di KV
      if (!look) {
        return new Response("Look tidak ditemukan", { 
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
  
      // 2. Ambil detail produk yang terikat dengan Look ini
      const relatedProducts = (look.product_slugs || [])
        .map(slug => catalogData[slug])
        .filter(Boolean);
  
      // 3. Render HTML Response
      const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${look.title} — Eunophy Lookbook</title>
    
    <!-- OpenGraph Tags untuk Pinterest & Social Media Share -->
    <meta property="og:title" content="${look.title} — Eunophy Lookbook">
    <meta property="og:description" content="Temukan outfit dan belanja rekomendasi item ini di Shopee.">
    <meta property="og:image" content="${look.hero_image}">
    <meta property="og:type" content="article">
  
    <!-- Typography Garamond konsisten dengan index.html -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="/style.css">
    <style>
      body { background-color: #fafafa; margin: 0; padding: 0; }
      .look-container { max-width: 1000px; margin: 30px auto; padding: 0 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
      @media (max-width: 768px) { .look-container { grid-template-columns: 1fr; gap: 20px; } }
      .look-hero-img { width: 100%; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .items-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .btn-share { margin-top: 16px; padding: 10px 18px; border: 1px solid #111; background: transparent; cursor: pointer; border-radius: 20px; font-weight: 500; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
      .btn-share:hover { background: #111; color: #fff; }
    </style>
  </head>
  <body>
  
    <header>
      <div class="header-container">
        <a href="/" class="brand-title" style="text-decoration: none; color: inherit;">EUNOPHY</a>
      </div>
    </header>
    
    <main class="look-container">
      <!-- Kolom Kiri: Image Full Outfit (Look) -->
      <div>
        <img src="${look.hero_image}" class="look-hero-img" alt="${look.title}" onerror="this.src='https://via.placeholder.com/600x800?text=Look+Image'">
        <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; margin: 16px 0 8px;">${look.title}</h1>
        <button class="btn-share" onclick="shareLook('${look.title}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Bagikan Look Ini
        </button>
      </div>
  
      <!-- Kolom Kanan: Produk-produk pendukung yang dipakai -->
      <div>
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #777; margin-bottom: 16px; margin-top: 0;">Items in this look</h3>
        
        ${relatedProducts.length === 0 ? '<p style="color:#888; font-size:13px;">Belum ada item produk terhubung.</p>' : ''}
  
        <div class="items-grid">
          ${relatedProducts.map(item => `
            <a href="${item.affiliate_url}" class="lookbook-card" target="_blank" rel="noopener noreferrer">
              <div class="img-container">
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/400x533?text=No+Image'">
              </div>
              <div class="card-bottom">
                <span class="product-code">${item.title}</span>
                <span class="category-tag">Beli di Shopee ↗</span>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </main>
  
    <script>
      function shareLook(title) {
        if (navigator.share) {
          navigator.share({ title: title, url: window.location.href }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Link berhasil disalin ke clipboard!');
        }
      }
    </script>
  </body>
  </html>
      `;
  
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
  
    } catch (err) {
      return new Response("Terjadi kesalahan server: " + err.message, { status: 500 });
    }
  }