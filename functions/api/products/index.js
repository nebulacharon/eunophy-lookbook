export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  // Default tetap "catalog" agar kompatibel dengan sistem yang ada sekarang
  const type = url.searchParams.get("type") || "catalog";

  try {
    let data = await env.EUNOPHY_KV.get(type, { type: "json" });

    // Inisialisasi data bawaan khusus catalog jika KV masih kosong
    if (type === "catalog" && (!data || Object.keys(data).length === 0)) {
      data = {
        "6130b": {
          "title": "6130.b",
          "category": "Celana & Rok",
          "segment": "bottoms",
          "image": "assets/images/6130.webp",
          "affiliate_url": "https://s.shopee.co.id/40fq7IbITQ"
        }
      };
      await env.EUNOPHY_KV.put("catalog", JSON.stringify(data));
    }

    return new Response(JSON.stringify(data || {}), {
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
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
    
    // Tentukan KV Key (default ke 'catalog')
    const targetKey = body.target || "catalog"; 
    let currentData = await env.EUNOPHY_KV.get(targetKey, { type: "json" }) || {};

    // Mendukung format lama (body.slug + body.product) DAN format baru (body.id + body.data)
    const keyId = body.slug || body.id;
    const itemData = body.product || body.data;

    if (!keyId || !itemData) {
      return new Response(JSON.stringify({ success: false, error: "Missing slug/id or product data" }), { status: 400 });
    }

    currentData[keyId] = itemData;
    await env.EUNOPHY_KV.put(targetKey, JSON.stringify(currentData));

    return new Response(JSON.stringify({ success: true, catalog: currentData, data: currentData }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}