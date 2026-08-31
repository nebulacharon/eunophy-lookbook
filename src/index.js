export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const authHeader = request.headers.get("Authorization") || "";
      const clientToken = authHeader.replace("Bearer ", "").trim();
      const correctToken = env.ADMIN_TOKEN || "adminKatalog2026!";
  
      // --- 1. INSTANT DIRECT LINK (/p/:slug) UNTUK PINTEREST & STORY ---
      if (url.pathname.startsWith("/p/")) {
        const parts = url.pathname.split("/").filter(Boolean);
        const slug = parts[1] ? parts[1].toLowerCase().trim() : null;
  
        if (slug) {
          try {
            const catalog = await env.EUNOPHY_KV.get("catalog", { type: "json" }) || {};
            const product = catalog[slug];
  
            if (product && product.affiliate_url) {
              return Response.redirect(product.affiliate_url, 302);
            }
          } catch (err) {}
        }
        return Response.redirect(`https://${url.host}/`, 302);
      }
  
      // --- 2. API AUTH ---
      if (url.pathname === "/api/auth/verify" && request.method === "POST") {
        if (clientToken === correctToken) {
          return new Response(JSON.stringify({ valid: true }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        return new Response(JSON.stringify({ valid: false }), { status: 401 });
      }
  
      // --- 3. API GET PRODUCTS (PUBLIC) ---
      if (url.pathname === "/api/products" && request.method === "GET") {
        try {
          let data = await env.EUNOPHY_KV.get("catalog", { type: "json" });
          if (!data || Object.keys(data).length === 0) {
            data = {
              "6130b": {
                "title": "6130.b",
                "category": "Celana & Rok",
                "image": "assets/images/6130.webp",
                "affiliate_url": "https://s.shopee.co.id/40fq7IbITQ"
              }
            };
            await env.EUNOPHY_KV.put("catalog", JSON.stringify(data));
          }
          return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (err) {
          return new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
        }
      }
  
      // --- 4. API POST PRODUCT (ADMIN ONLY) ---
      if (url.pathname === "/api/products" && request.method === "POST") {
        if (clientToken !== correctToken) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        try {
          const body = await request.json();
          let currentData = await env.EUNOPHY_KV.get("catalog", { type: "json" }) || {};
          
          currentData[body.slug] = body.product;
          await env.EUNOPHY_KV.put("catalog", JSON.stringify(currentData));
  
          return new Response(JSON.stringify({ success: true, catalog: currentData }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
        }
      }
  
      // --- 5. API DELETE PRODUCT (ADMIN ONLY) ---
      if (url.pathname === "/api/products/delete" && request.method === "POST") {
        if (clientToken !== correctToken) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        try {
          const { slug } = await request.json();
          let currentData = await env.EUNOPHY_KV.get("catalog", { type: "json" }) || {};
          
          if (currentData[slug]) {
            delete currentData[slug];
            await env.EUNOPHY_KV.put("catalog", JSON.stringify(currentData));
          }
  
          return new Response(JSON.stringify({ success: true, catalog: currentData }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
        }
      }
  
      // --- 6. ASSETS SERVING ---
      return env.ASSETS.fetch(request);
    }
  };