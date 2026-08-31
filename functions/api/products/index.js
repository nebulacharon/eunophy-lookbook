export async function onRequestGet(context) {
    const { env } = context;
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
  
  export async function onRequestPost(context) {
    const { request, env } = context;
    const authHeader = request.headers.get("Authorization") || "";
    const clientToken = authHeader.replace("Bearer ", "").trim();
    const correctToken = env.ADMIN_TOKEN || "adminKatalog2026!";
  
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