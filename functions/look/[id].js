export async function onRequestGet(context) {
    const { params, env, request } = context;
    const rawLookId = params.id ? params.id.trim() : '';
    const searchId = rawLookId.toLowerCase();
  
    try {
      const originUrl = new URL(request.url).origin;
  
      // 1. Ambil file index.html ASLI dari Cloudflare Static Assets
      const assetResponse = await env.ASSETS.fetch(`${originUrl}/index.html`);
      let html = await assetResponse.text();
  
      // 2. Ambil data looks dari KV Store
      const looksData = await env.EUNOPHY_KV.get("looks", { type: "json" }) || {};
      
      // Pencarian ID tanpa memedulikan huruf besar/kecil (case-insensitive)
      const matchedKey = Object.keys(looksData).find(key => key.toLowerCase() === searchId);
      const look = matchedKey ? looksData[matchedKey] : null;
  
      // 3. Jika look ditemukan, inject Meta Tag OpenGraph ke dalam index.html
      if (look) {
        const lookTitle = look.title || "Curated Look";
        const lookImage = look.hero_image || "";
        const shareUrl = `${originUrl}/look/${look.id || rawLookId}`;
  
        const metaTags = `
      <title>${lookTitle} — EUNOPHY</title>
      <meta property="og:title" content="${lookTitle} — EUNOPHY">
      <meta property="og:description" content="Temukan inspirasi gaya dan belanja rekomendasi outfit ini di EUNOPHY.">
      <meta property="og:image" content="${lookImage}">
      <meta property="og:url" content="${shareUrl}">
      <meta property="og:type" content="article">
        `;
  
        // Ganti tag <title> bawaan di index.html dengan Meta Tags dinamis ini
        html = html.replace(/<title>.*?<\/title>/i, metaTags);
      }
  
      // 4. Kirim HTML yang sudah disempurnakan ke browser
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
  
    } catch (err) {
      return new Response("Terjadi kesalahan server: " + err.message, { 
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  }