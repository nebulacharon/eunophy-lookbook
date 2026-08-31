export async function onRequestPost(context) {
    const { request, env } = context;
    const authHeader = request.headers.get("Authorization") || "";
    const clientToken = authHeader.replace("Bearer ", "").trim();
    const correctToken = env.ADMIN_TOKEN || "adminKatalog2026!";
  
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