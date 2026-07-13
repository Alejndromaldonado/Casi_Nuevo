import { createClient } from "@supabase/supabase-js";

export default async (req: Request) => {
  const url = new URL(req.url);
  const productId = url.pathname.split("/").pop();

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  if (!productId || !supabaseUrl || !supabaseKey) {
    console.error("Missing parameters or env vars:", { productId, supabaseUrl, hasKey: !!supabaseKey });
    return new Response(null, {
      status: 302,
      headers: { Location: "/" }
    });
  }

  // Create a minimal client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch product
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error || !product) {
    console.error("Error fetching product for preview:", error || "Product not found");
    return new Response(null, {
      status: 302,
      headers: { Location: "/" }
    });
  }

  // Format price
  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(product.precio);

  const title = `${product.titulo} - ${formattedPrice} | Casi Nuevo`;
  const description = product.descripcion || "Venta de liquidación - Excelente estado y precio especial.";
  const imageUrl = product.url_imagen_cloudinary || "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600";

  // Return HTML with meta tags and redirect script
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url.origin}/product/${product.id}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="450">
    <meta property="og:site_name" content="Casi Nuevo">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${url.origin}/product/${product.id}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${imageUrl}">

    <!-- Redirect script -->
    <script>
        window.location.replace("/#product-${product.id}");
    </script>
</head>
<body>
    <p>Redireccionando a la oferta de ${product.titulo}...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
};
