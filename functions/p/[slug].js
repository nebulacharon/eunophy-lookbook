export async function onRequestGet(context) {
    const { params, env, request } = context;
    const slug = params.slug ? params.slug.toLowerCase().trim() : null;
    const url = new URL(request.url);
  
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