export async function onRequestGet(context) {
    const { params, env, request } = context;
    const lookId = params.id ? params.id.toLowerCase() : '';
  
    try {
      // 1. Ambil data dari Cloudflare KV
      const looksData = await env.EUNOPHY_KV.get("looks", { type: "json" }) || {};
      const look = looksData[lookId];
  
      // Jika Look ID tidak ditemukan di KV
      if (!look) {
        return new Response("Look tidak ditemukan", { 
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
  
      const lookTitle = look.title || "Curated Look";
      const lookImage = look.hero_image || "";
      const siteUrl = new URL(request.url).origin;
  
      // 2. Render Full SPA HTML + Auto Open Modal Script
      const html = `<!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lookTitle} — EUNOPHY</title>
  
    <!-- Dynamic OpenGraph Tags untuk Social Media & Pinterest Share -->
    <meta property="og:title" content="${lookTitle} — EUNOPHY">
    <meta property="og:description" content="Temukan inspirasi gaya dan belanja rekomendasi outfit ini di Shopee.">
    <meta property="og:image" content="${lookImage}">
    <meta property="og:url" content="${siteUrl}/look/${lookId}">
    <meta property="og:type" content="article">
  
    <!-- Typography Garamond & Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  
    <!-- Gunakan Absolute Path '/' agar CSS tidak Not Found -->
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
  
    <!-- Header Section -->
    <header class="site-header">
      <div class="header-container">
        <a href="/" class="brand-title">EUNOPHY</a>
        <div class="header-nav">
          <button id="btn-view-looks" class="nav-tab active" onclick="switchViewMode('looks')">Curated Looks</button>
          <button id="btn-view-catalog" class="nav-tab" onclick="switchViewMode('catalog')">All Items</button>
        </div>
      </div>
    </header>
  
    <!-- Hero Section -->
    <section class="hero-section">
      <h1 class="hero-title">CURATED LOOKS & STYLES</h1>
      <p class="hero-subtitle">Inspirasi padu padan busana pilihan untuk gaya harianmu</p>
      
      <div class="search-wrapper">
        <input type="text" id="search-input" placeholder="Cari style, blazer, kemeja, celana..." autocomplete="off">
      </div>
    </section>
  
    <!-- Collection Filter Bar -->
    <div id="collections-bar" class="collections-bar"></div>
  
    <!-- Main Category Nav -->
    <nav id="category-nav" class="category-nav">
      <button class="cat-pill active" data-segment="all">All Items</button>
      <button class="cat-pill" data-segment="tops">Tops</button>
      <button class="cat-pill" data-segment="bottoms">Bottoms</button>
      <button class="cat-pill" data-segment="outer">Outerwear</button>
      <button class="cat-pill" data-segment="shoes">Shoes</button>
    </nav>
  
    <!-- Grid Main Container -->
    <main class="main-content">
      <div id="grid-container" class="products-grid">
        <div style="grid-column:1/-1; text-align:center; padding:40px; color:#64748b;">Memuat koleksi...</div>
      </div>
    </main>
  
    <!-- Detail Look Modal Pop-up -->
    <div id="detail-modal" class="modal-backdrop">
      <div class="modal-container">
        <button class="modal-close" onclick="closeDetailModal()">&times;</button>
        <div id="modal-content-body"></div>
      </div>
    </div>
  
    <!-- Absolute Path untuk App JS -->
    <script src="/app.js"></script>
  
    <!-- SCRIPT TAMBAHAN: Auto Open Modal saat data selesai dimuat dari JS -->
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        // Tunggu hingga data dari app.js selesai diambil, lalu buka modal
        const checkDataAndOpen = setInterval(() => {
          if (typeof allLooks !== 'undefined' && Object.keys(allLooks).length > 0) {
            clearInterval(checkDataAndOpen);
            if (typeof openLookDetailModal === 'function') {
              openLookDetailModal('${lookId}');
            }
          }
        }, 100);
      });
    </script>
  </body>
  </html>`;
  
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
  
    } catch (err) {
      return new Response("Terjadi kesalahan server: " + err.message, { status: 500 });
    }
  }