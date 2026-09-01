export async function onRequestGet(context) {
    const { params, env, request } = context;
    const slug = params.slug ? params.slug.toLowerCase().trim() : null;
    const url = new URL(request.url);
  
    let product = null;
    if (slug) {
      try {
        const catalog = await env.EUNOPHY_KV.get("catalog", { type: "json" }) || {};
        product = catalog[slug];
      } catch (err) {}
    }
  
    if (!product) {
      return Response.redirect(`https://${url.host}/`, 302);
    }
  
    const html = `<!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.title} — EUNOPHY</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { background: #fafafa; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 24px 16px; color: #0f172a; }
      
      header { width: 100%; max-width: 480px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .brand-title { font-size: 16px; font-weight: 700; letter-spacing: 2.5px; text-decoration: none; color: #0f172a; }
      .all-catalog-link { font-size: 12px; color: #64748b; text-decoration: none; display: flex; align-items: center; gap: 4px; }
      .all-catalog-link:hover { color: #0f172a; }
  
      .single-container { width: 100%; max-width: 380px; margin: auto 0; }
      .lookbook-card { display: block; text-decoration: none; color: inherit; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
      
      .img-container { position: relative; width: 100%; aspect-ratio: 3 / 4; overflow: hidden; background: #f1f5f9; }
      .img-container img { width: 100%; height: 100%; object-fit: cover; display: block; }
  
      /* Overlay Gradasi Permanen */
      .overlay-info {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.72) 80%, rgba(0,0,0,0.92) 100%);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 18px 16px;
        color: #ffffff;
      }
  
      .overlay-code { font-size: 14px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
  
      /* Animasi Idle Pulsing Tombol CTA */
      .overlay-action-badge {
        background: #ffffff;
        color: #0f172a;
        font-size: 12px;
        font-weight: 600;
        padding: 10px 14px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        animation: pulseAttention 2.2s infinite ease-in-out;
      }
  
      @keyframes pulseAttention {
        0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
        50% { transform: scale(1.025); box-shadow: 0 6px 18px rgba(0,0,0,0.4); background: #f8fafc; }
        100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
      }
  
      .card-bottom { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; }
      .product-code { font-size: 13px; font-weight: 600; }
      .category-tag { font-size: 11.5px; color: #64748b; }
    </style>
  </head>
  <body>
  
    <header>
      <a href="/" class="brand-title">EUNOPHY</a>
      <a href="/" class="all-catalog-link">
        Lihat Semua Katalog
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </header>
  
    <div class="single-container">
      <a href="${product.affiliate_url}" class="lookbook-card" target="_blank" rel="noopener noreferrer">
        <div class="img-container">
          <img src="${product.image}" alt="${product.title}">
          <div class="overlay-info">
            <span class="overlay-code">${product.title}</span>
            <div class="overlay-action-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Klik untuk beli di Shopee ↗
            </div>
          </div>
        </div>
        <div class="card-bottom">
          <span class="product-code">${product.title}</span>
          <span class="category-tag">${product.category || 'Lookbook'}</span>
        </div>
      </a>
    </div>
  
  </body>
  </html>`;
  
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }