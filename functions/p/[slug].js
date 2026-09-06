export async function onRequestGet(context) {
  const { params, env, request } = context;
  const slug = params.slug ? params.slug.toLowerCase().trim() : null;
  const url = new URL(request.url);

  if (slug) {
    try {
      const catalog = await env.EUNOPHY_KV.get("catalog", { type: "json" }) || {};
      const product = catalog[slug];

      if (product && product.affiliate_url) {
        // 1. Gabungkan Query Params asal (UTM, sub_id, dll) ke Link Affiliate
        const targetUrl = new URL(product.affiliate_url);
        url.searchParams.forEach((value, key) => {
          targetUrl.searchParams.set(key, value);
        });

        const finalDestination = targetUrl.toString();

        // 2. Gunakan HTML Landing Redirect untuk memicu Deep Link Aplikasi Shopee
        const redirectHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${finalDestination}">
  <title>Membuka Shopee...</title>
  <script>
    window.location.href = "${finalDestination}";
  </script>
</head>
<body style="background:#fafafa;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
  <p style="color:#64748b;font-size:14px;">Mengarahkan ke Shopee...</p>
</body>
</html>`;

        return new Response(redirectHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
    } catch (err) {}
  }

  return Response.redirect(`https://${url.host}/`, 302);
}