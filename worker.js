
// --- HELPER: SCRAPE PIXABAY MUSIC ---
async function scrapePixabay(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  const CATEGORY = "dj";
  const PAGES_TO_SCRAPE = 10; 
  let newSets = [];
  let processedIds = new Set();

  console.log(`[Scraper] Starting Pixabay scrape for category: ${CATEGORY} (Pages: ${PAGES_TO_SCRAPE})`);

  for (let page = 1; page <= PAGES_TO_SCRAPE; page++) {
    try {
      const url = `https://pixabay.com/music/search/${CATEGORY}/?pagi=${page}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Referer': 'https://pixabay.com/music/'
        }
      });

      if (!response.ok) {
        console.warn(`[Scraper] Page ${page} failed: ${response.status}`);
        continue;
      }

      const html = await response.text();

      // REGEX EXTRACTION STRATEGY
      const mp3Regex = /https:\/\/cdn\.pixabay\.com\/audio\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\/audio_([a-zA-Z0-9-]+)\.mp3/g;
      let match;
      let pageCount = 0;
      
      while ((match = mp3Regex.exec(html)) !== null) {
        const fileUrl = match[0];
        const rawId = match[1];
        const uniqueId = `pixabay_${rawId}`;
        
        if (processedIds.has(uniqueId)) continue;
        processedIds.add(uniqueId);
        pageCount++;

        let title = rawId.replace(/^audio_/, '').replace(/[0-9-]+/, ' ').replace(/-/g, ' ').trim();
        if (title.length < 3) title = `Pixabay DJ Mix ${Math.floor(Math.random() * 1000)}`;
        title = title.replace(/\b\w/g, l => l.toUpperCase());

        newSets.push({
          id: uniqueId,
          title: title,
          djName: 'Pixabay Artist',
          coverUrl: `https://picsum.photos/seed/${uniqueId}/400/400`,
          fileUrl: fileUrl,
          duration: '3:00', // Estimate
          bpm: 128,
          tags: ['Pixabay', 'DJ'],
          plays: Math.floor(Math.random() * 5000),
          djuuId: '' 
        });
      }
      console.log(`[Scraper] Page ${page}: Found ${pageCount} items`);

    } catch (e) {
      console.error(`[Scraper] Error on page ${page}:`, e);
    }
  }

  // SAVE TO KV
  if (newSets.length > 0) {
    try {
      const currentDataStr = await env.DB.get('app_data');
      let currentData = currentDataStr ? JSON.parse(currentDataStr) : {};
      
      let existingSets = currentData.djSets || [];
      const existingIds = new Set(existingSets.map(s => s.id));
      
      // Filter out duplicates
      const uniqueNewSets = newSets.filter(s => !existingIds.has(s.id));
      
      if (uniqueNewSets.length > 0) {
        // Add new sets to the beginning
        const updatedSets = [...uniqueNewSets, ...existingSets];
        
        // Safety limit to prevent KV size explosion (keep latest 500)
        const trimmedSets = updatedSets.slice(0, 500);

        currentData.djSets = trimmedSets;
        await env.DB.put('app_data', JSON.stringify(currentData));
        return { success: true, count: uniqueNewSets.length, total: trimmedSets.length };
      }
      return { success: true, count: 0, message: "No new unique items found (duplicates skipped)" };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
  return { success: true, count: 0 };
}


export default {
  // --- 1. CRON TRIGGER HANDLER ---
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapePixabay(env));
  },

  // --- 2. HTTP FETCH HANDLER ---
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range, x-admin-key",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, ETag"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const isAuthorized = (req) => {
      if (!env.ADMIN_SECRET) return true;
      const authHeader = req.headers.get("x-admin-key");
      return authHeader === env.ADMIN_SECRET;
    };

    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const providedKey = body.key;
        if (!env.ADMIN_SECRET) return new Response(JSON.stringify({ valid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (providedKey === env.ADMIN_SECRET) return new Response(JSON.stringify({ valid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        else return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    // --- NEW: MANUAL TRIGGER FOR SCRAPER ---
    if (url.pathname === '/api/admin/scrape' && request.method === 'POST') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const result = await scrapePixabay(env);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/sync' && request.method === 'GET') {
      try {
        if (!env.DB) return new Response(JSON.stringify({ empty: true, warning: "KV_NOT_BOUND" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const data = await env.DB.get('app_data');
        if (!data) return new Response(JSON.stringify({ empty: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    if (url.pathname === '/api/sync' && request.method === 'POST') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        if (!env.DB) return new Response(JSON.stringify({ error: "KV Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const body = await request.json();
        await env.DB.put('app_data', JSON.stringify(body));
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      try {
        if (!env.BUCKET) return new Response(JSON.stringify({ error: "R2 Bucket Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const filename = url.searchParams.get('filename') || `upload-${Date.now()}`;
        await env.BUCKET.put(filename, request.body);
        let publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}` : `/api/file/${filename}`;
        return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }
    
    if (url.pathname === '/api/storage/list' && request.method === 'GET') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       try {
          if (!env.BUCKET) return new Response(JSON.stringify({ files: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          const listed = await env.BUCKET.list({ limit: 500 });
          const files = listed.objects.map(obj => {
             let publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${obj.key}` : `/api/file/${obj.key}`;
             return { key: obj.key, size: obj.size, uploaded: obj.uploaded, url: publicUrl };
          });
          return new Response(JSON.stringify({ files }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    if (url.pathname === '/api/storage/delete' && request.method === 'DELETE') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       try {
           const key = url.searchParams.get('key');
           if(!key) throw new Error("Missing key");
           await env.BUCKET.delete(key);
           return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    if (url.pathname.startsWith('/api/file/') && request.method === 'GET') {
        if (!env.BUCKET) return new Response("R2 Bucket Not Configured", { status: 404 });
        const filename = url.pathname.replace('/api/file/', '');
        try {
            const rangeHeader = request.headers.get('Range');
            const object = await env.BUCKET.get(filename, { range: rangeHeader ? request.headers : undefined, onlyIf: request.headers });
            if (object === null) return new Response('Object Not Found', { status: 404, headers: corsHeaders });
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            Object.keys(corsHeaders).forEach(k => headers.set(k, corsHeaders[k]));
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            headers.set('Accept-Ranges', 'bytes');
            if (rangeHeader && object.range) {
                headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
                headers.set('Content-Length', object.range.length);
                return new Response(object.body, { headers, status: 206 });
            } else {
                headers.set('Content-Length', object.size);
                return new Response(object.body, { headers, status: 200 });
            }
        } catch(e) { return new Response(`Stream Error: ${e.message}`, { status: 500, headers: corsHeaders }); }
    }

    // --- DJUU PROXY: ROBUST IMPLEMENTATION ---
    if (url.pathname === '/api/djuu/stream' && request.method === 'GET') {
        const djuuId = url.searchParams.get('id');
        if (!djuuId) return new Response("Missing DJUU ID", { status: 400 });
        
        try {
            const pageUrl = `https://www.djuu.com/play/${djuuId}.html`;
            
            // 1. Fetch the Play Page to find the MP3 Link
            const pageResponse = await fetch(pageUrl, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                    'Referer': 'https://www.djuu.com/' 
                } 
            });
            
            if (!pageResponse.ok) return new Response(`DJUU Page Error: ${pageResponse.status}`, { status: 502 });
            const html = await pageResponse.text();

            // 2. Aggressive Regex to find MP3 link inside JS variables
            // Pattern 1: mp3:"http://..." or file:"http://..." (Common in their players)
            // Pattern 2: Any string ending in .mp3 or .m4a that starts with http
            let audioUrl = null;

            // Strategy A: Look for JS variable assignment
            const varMatch = html.match(/(?:mp3|file|url)\s*[:=]\s*["']([^"']+\.(?:mp3|m4a))["']/i);
            if (varMatch) {
                audioUrl = varMatch[1];
            }

            // Strategy B: Look for any http link ending in media extension
            if (!audioUrl) {
                 const fallbackMatch = html.match(/https?:\/\/[^"'\s]+\.(?:mp3|m4a)/i);
                 if (fallbackMatch) audioUrl = fallbackMatch[0];
            }

            if (!audioUrl) {
                 return new Response("Could not extract audio URL from DJUU source", { status: 404 });
            }

            // Clean URL (remove JSON escaped slashes if any)
            audioUrl = audioUrl.replace(/\\/g, '');

            // 3. Proxy the Audio Stream
            const rangeHeader = request.headers.get('Range');
            const audioHeaders = { 
                'Referer': pageUrl, // Crucial: Referer must be the play page URL
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            };
            
            if (rangeHeader) audioHeaders['Range'] = rangeHeader;

            const audioResponse = await fetch(audioUrl, { headers: audioHeaders });
            
            // 4. Forward response with CORS headers
            const responseHeaders = new Headers(audioResponse.headers);
            
            // Override CORS to allow our frontend
            Object.keys(corsHeaders).forEach(k => responseHeaders.set(k, corsHeaders[k]));
            
            // Ensure Content-Type is correct (sometimes proxies mess this up)
            if (!responseHeaders.get('Content-Type')) {
                responseHeaders.set('Content-Type', 'audio/mpeg');
            }

            return new Response(audioResponse.body, { 
                status: audioResponse.status, 
                headers: responseHeaders 
            });

        } catch (e) { 
            return new Response(`DJUU Proxy Error: ${e.message}`, { status: 500 }); 
        }
    }

    // SPA Fallback
    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status >= 200 && response.status < 400) return response;
      if (response.status === 404 && !url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return response;
    } catch (e) { return new Response("Internal Error", { status: 500 }); }
  },
};
