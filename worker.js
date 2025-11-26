
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- CORS HEADERS HELPER ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range, x-admin-key",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, ETag"
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

    // 0. AUTH VERIFICATION ENDPOINT
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const providedKey = body.key;
        
        if (!env.ADMIN_SECRET) {
             return new Response(JSON.stringify({ valid: true, message: "No server secret configured" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        if (providedKey === env.ADMIN_SECRET) {
             return new Response(JSON.stringify({ valid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
             return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) {
         return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 1. GET DATA (Retrieve full state from KV)
    if (url.pathname === '/api/sync' && request.method === 'GET') {
      try {
        if (!env.DB) {
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

    // 2. SAVE DATA (Save full state to KV)
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: "KV Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const body = await request.json();
        await env.DB.put('app_data', JSON.stringify(body));
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 3. UPLOAD FILE (Put object to R2)
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        if (!env.BUCKET) {
           return new Response(JSON.stringify({ error: "R2 Bucket Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const filename = url.searchParams.get('filename') || `upload-${Date.now()}`;
        await env.BUCKET.put(filename, request.body);
        
        let publicUrl;
        if (env.R2_PUBLIC_URL) {
           const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, "");
           publicUrl = `${baseUrl}/${filename}`;
        } else {
           // Use relative path to let the frontend hit the worker proxy
           publicUrl = `/api/file/${filename}`;
        }

        return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 4. LIST FILES (R2)
    if (url.pathname === '/api/storage/list' && request.method === 'GET') {
       if (!isAuthorized(request)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       }
       try {
          if (!env.BUCKET) return new Response(JSON.stringify({ files: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          
          const listed = await env.BUCKET.list({ limit: 500 });
          const files = listed.objects.map(obj => {
             let publicUrl;
             if (env.R2_PUBLIC_URL) {
                const baseUrl = env.R2_PUBLIC_URL.replace(/\/$/, "");
                publicUrl = `${baseUrl}/${obj.key}`;
             } else {
                publicUrl = `/api/file/${obj.key}`;
             }
             return {
                 key: obj.key,
                 size: obj.size,
                 uploaded: obj.uploaded,
                 url: publicUrl
             };
          });
          return new Response(JSON.stringify({ files }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
       }
    }

    // 5. DELETE FILE (R2)
    if (url.pathname === '/api/storage/delete' && request.method === 'DELETE') {
       if (!isAuthorized(request)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       }
       try {
           const key = url.searchParams.get('key');
           if(!key) throw new Error("Missing key");
           await env.BUCKET.delete(key);
           return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       } catch (e) {
           return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
       }
    }

    // 6. SERVE FILE (HIGH PERFORMANCE PROXY with RANGE SUPPORT)
    if (url.pathname.startsWith('/api/file/') && request.method === 'GET') {
        if (!env.BUCKET) {
           return new Response("R2 Bucket Not Configured", { status: 404 });
        }

        const filename = url.pathname.replace('/api/file/', '');
        
        try {
            // Check for Range header (Critical for audio seeking/streaming)
            const rangeHeader = request.headers.get('Range');
            
            // Fetch object from R2 with range support
            // R2 `get` accepts a 'range' option which matches the HTTP header
            const object = await env.BUCKET.get(filename, {
                range: rangeHeader ? request.headers : undefined,
                onlyIf: request.headers // supports ETag checks
            });

            if (object === null) {
              return new Response('Object Not Found', { status: 404, headers: corsHeaders });
            }

            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            
            // Add CORS headers
            Object.keys(corsHeaders).forEach(k => headers.set(k, corsHeaders[k]));

            // PERFORMANCE: Cache Control (Immutable for 1 year)
            // This tells browser: "Don't ask server again, keep this file."
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            headers.set('Accept-Ranges', 'bytes');

            // Handle Partial Content (Range Responses)
            if (rangeHeader && object.range) {
                headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
                headers.set('Content-Length', object.range.length);
                return new Response(object.body, {
                    headers,
                    status: 206 // Partial Content
                });
            } else {
                // Full Content
                headers.set('Content-Length', object.size);
                return new Response(object.body, {
                    headers,
                    status: 200 // OK
                });
            }

        } catch(e) {
            return new Response(`Stream Error: ${e.message}`, { status: 500, headers: corsHeaders });
        }
    }

    // --- STATIC ASSETS & SPA FALLBACK ---
    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status >= 200 && response.status < 400) return response;
      if (response.status === 404 && !url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return response;
    } catch (e) {
      return new Response("Internal Error", { status: 500 });
    }
  },
};
