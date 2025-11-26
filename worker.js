
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- CORS HEADERS HELPER ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    };

    // --- HANDLE PREFLIGHT ---
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- AUTHENTICATION CHECK HELPER ---
    const isAuthorized = (req) => {
      // If ADMIN_SECRET is not set in Cloudflare Dashboard, allow all (Development mode)
      if (!env.ADMIN_SECRET) return true;
      
      const authHeader = req.headers.get("x-admin-key");
      // Check if header matches the environment variable
      return authHeader === env.ADMIN_SECRET;
    };

    // --- API ROUTES ---

    // 1. GET DATA (Retrieve full state from KV) - PUBLIC READ
    if (url.pathname === '/api/sync' && request.method === 'GET') {
      try {
        if (!env.DB) {
           // Graceful fallback if KV is not bound yet
           return new Response(JSON.stringify({ empty: true, warning: "KV_NOT_BOUND" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    // 2. SAVE DATA (Save full state to KV) - PROTECTED WRITE
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing Admin Key" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: "Cloudflare KV 未绑定。请在后台 Settings -> Variables 添加 KV Namespace 绑定，变量名为 'DB'。" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const body = await request.json();
        await env.DB.put('app_data', JSON.stringify(body));
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 3. UPLOAD FILE (Put object to R2) - PROTECTED WRITE
    // Usage: PUT /api/upload?filename=image.jpg
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing Admin Key" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        if (!env.BUCKET) {
           return new Response(JSON.stringify({ error: "Cloudflare R2 未绑定。请在后台 Settings -> Variables 添加 R2 Bucket 绑定，变量名为 'BUCKET'。" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const filename = url.searchParams.get('filename') || `upload-${Date.now()}`;
        // Write to R2 Bucket
        await env.BUCKET.put(filename, request.body);
        
        // Construct Public URL
        // If R2_PUBLIC_URL var is set (Custom Domain), use it.
        // Otherwise, use the worker's proxy endpoint.
        let publicUrl;
        if (env.R2_PUBLIC_URL) {
           // Ensure no trailing slash
           const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, "");
           publicUrl = `${baseUrl}/${filename}`;
        } else {
           publicUrl = `/api/file/${filename}`;
        }

        return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 4. SERVE FILE (Proxy R2 if no custom domain) - PUBLIC READ
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
