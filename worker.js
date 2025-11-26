
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- CORS HEADERS HELPER ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // --- HANDLE PREFLIGHT ---
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- API ROUTES ---

    // 1. GET DATA (Retrieve full state from KV)
    if (url.pathname === '/api/sync' && request.method === 'GET') {
      try {
        if (!env.DB) {
           console.warn("KV 'DB' binding not found. Serving empty/mock response.");
           return new Response(JSON.stringify({ empty: true, warning: "KV not configured" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const data = await env.DB.get('app_data');
        if (!data) {
          return new Response(JSON.stringify({ empty: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 2. SAVE DATA (Save full state to KV)
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: "Cloudflare KV 未配置。请在 wrangler.json 中添加 kv_namespaces 绑定。" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const body = await request.json();
        await env.DB.put('app_data', JSON.stringify(body));
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 3. UPLOAD FILE (Put object to R2)
    // Usage: PUT /api/upload?filename=image.jpg
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      try {
        if (!env.BUCKET) {
           return new Response(JSON.stringify({ error: "Cloudflare R2 未配置。请在 wrangler.json 中添加 r2_buckets 绑定。" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const filename = url.searchParams.get('filename') || `upload-${Date.now()}`;
        // Write to R2 Bucket
        await env.BUCKET.put(filename, request.body);
        
        // Construct Public URL
        // If R2_PUBLIC_URL var is set (Custom Domain), use it.
        // Otherwise, use the worker's proxy endpoint.
        let publicUrl;
        if (env.R2_PUBLIC_URL) {
           publicUrl = `${env.R2_PUBLIC_URL}/${filename}`;
        } else {
           publicUrl = `/api/file/${filename}`;
        }

        return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 4. SERVE FILE (Proxy R2 if no custom domain)
    // Usage: GET /api/file/filename.jpg
    if (url.pathname.startsWith('/api/file/') && request.method === 'GET') {
        if (!env.BUCKET) {
           return new Response("R2 Bucket Not Configured", { status: 404 });
        }

        const filename = url.pathname.replace('/api/file/', '');
        const object = await env.BUCKET.get(filename);

        if (object === null) {
          return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        // Set Cache Control for performance
        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(object.body, { headers });
    }

    // --- STATIC ASSETS & SPA FALLBACK (Existing Logic) ---
    try {
      let response = await env.ASSETS.fetch(request);
      
      if (response.status >= 200 && response.status < 400) {
        return response;
      }

      if (response.status === 404 && !url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }

      return response;
    } catch (e) {
      return new Response("Internal Error", { status: 500 });
    }
  },
};
