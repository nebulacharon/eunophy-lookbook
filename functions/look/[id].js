export async function onRequestGet(context) {
    const { params, env, request } = context;
    const rawLookId = params.id ? params.id.trim() : '';
    const searchId = rawLookId.toLowerCase();
  
    try {
      const originUrl = new URL(request.url).origin;
  
      // 1. Memanggil index.html asli dari Static Assets Cloudflare
      const assetResponse = await env.ASSETS.fetch(`${originUrl}/index.html`);
      let html = await assetResponse.text();
  
      // 2. Ambil data looks dari KV Store
      const looksData = await env.EUNOPHY_KV.get("looks", { type: "json" }) || {};
      
      // Cari look (case-insensitive)
      const matchedKey = Object.keys(looksData).find(key => key.toLowerCase() === searchId);
      const look = matchedKey ? looksData[matchedKey] : null;
  
      // 3. Inject Meta Tag OpenGraph dinamis
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
  
        html = html.replace(/<title>.*?<\/title>/i, metaTags);
      }
  
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
  
    } catch (err) {
      return new Response("Server Error: " + err.message, { 
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  }