export async function onRequestPost(context) {
    const { request, env } = context;
    const authHeader = request.headers.get("Authorization") || "";
    const clientToken = authHeader.replace("Bearer ", "").trim();
    const correctToken = env.ADMIN_TOKEN || "adminKatalog2026!";
  
    if (clientToken === correctToken) {
      return new Response(JSON.stringify({ valid: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ valid: false }), { status: 401 });
  }