export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const params = url.searchParams;

  // Build the target API URL
  const apiBase = "https://api.jejaring.cc/videos.php";
  const targetUrl = new URL(apiBase);

  // Forward all query parameters
  for (const [key, value] of params.entries()) {
    targetUrl.searchParams.set(key, value);
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CloudflarePages/1.0)",
        "Accept": "application/json",
      },
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: "Failed to fetch from API" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}