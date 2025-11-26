
// --- HELPER: SCRAPE PIXABAY MUSIC ---
async function scrapePixabay(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  const CATEGORY = "dj";
  const PAGES_TO_SCRAPE = 5; // Pixabay often blocks aggressive scraping, lower pages per run is safer
  let newSets = [];
  let processedIds = new Set();
  let log = [];

  console.log(`[Scraper] Starting Pixabay scrape for category: ${CATEGORY}`);

  // Browser-like headers to avoid 403
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };

  for (let page = 1; page <= PAGES_TO_SCRAPE; page++) {
    try {
      const url = `https://pixabay.com/music/search/${CATEGORY}/?pagi=${page}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        log.push(`Page ${page} failed: ${response.status}`);
        continue;
      }

      const html = await response.text();
      let pageItemsCount = 0;

      // --- STRATEGY 1: JSON-LD or Next.js/Hydration Data Scraping ---
      // Pixabay often embeds data in scripts. We look for mp3 URLs specifically.
      // Matches both "https://cdn..." and escaped "https:\/\/cdn..."
      const urlRegex = /https?:\\?\/\\?\/cdn\.pixabay\.com\\?\/audio\\?\/[0-9]{4}\\?\/[0-9]{2}\\?\/[0-9]{2}\\?\/[a-zA-Z0-9-_]+\.mp3/g;
      
      const matches = html.match(urlRegex) || [];
      
      // Deduplicate found URLs on this page
      const uniqueUrls = [...new Set(matches)];

      for (let rawUrl of uniqueUrls) {
        // Clean URL: remove backslashes
        const fileUrl = rawUrl.replace(/\\/g, '');
        
        // Extract ID from URL to avoid duplicates across runs
        // URL format: .../audio/2023/10/01/audio_12345-abc.mp3
        const idMatch = fileUrl.match(/\/audio\/(\d{4}\/\d{2}\/\d{2}\/[^/]+)\.mp3/);
        const rawId = idMatch ? idMatch[1] : Math.random().toString(36);
        const uniqueId = `pixabay_${rawId.replace(/[\/.]/g, '_')}`;

        if (processedIds.has(uniqueId)) continue;
        processedIds.add(uniqueId);

        // Generate Title from filename part
        const filename = fileUrl.split('/').pop() || '';
        let title = filename
          .replace(/^audio_/, '')
          .replace(/\.mp3$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/[0-9]+/g, '') // Remove numbers for cleaner title
          .trim();
        
        if (title.length < 3) title = `Deep House Session ${Math.floor(Math.random() * 99)}`;
        
        // Capitalize
        title = title.replace(/\b\w/g, l => l.toUpperCase());

        newSets.push({
          id: uniqueId,
          title: title,
          djName: 'Pixabay Artist',
          coverUrl: `https://picsum.photos/seed/${uniqueId}/400/400`,
          fileUrl: fileUrl,
          duration: '3:00', // Placeholder
          bpm: 124 + Math.floor(Math.random() * 10),
          tags: ['Pixabay', 'House', 'Techno'],
          plays: Math.floor(Math.random() * 2000)
        });
        pageItemsCount++;
      }
      
      log.push(`Page ${page}: Found ${pageItemsCount} items`);
      
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 200));

    } catch (e) {
      log.push(`Page ${page} Error: ${e.message}`);
    }
  }

  // --- SAVE TO KV ---
  if (newSets.length > 0) {
    try {
      const currentDataStr = await env.DB.get('app_data');
      let currentData = currentDataStr ? JSON.parse(currentDataStr) : {};
      
      let existingSets = currentData.djSets || [];
      const existingIds = new Set(existingSets.map(s => s.id));
      
      // Filter out global duplicates
      const uniqueNewSets = newSets.filter(s => !existingIds.has(s.id));
      
      if (uniqueNewSets.length > 0) {
        const updatedSets = [...uniqueNewSets, ...existingSets].slice(0, 300); // Keep max 300
        currentData.djSets = updatedSets;
        await env.DB.put('app_data', JSON.stringify(currentData));
        return { success: true, count: uniqueNewSets.length, logs: log };
      }
      return { success: true, count: 0, message: "No new unique items", logs: log };
    } catch (e) {
      return { success: false, message: e.message, logs: log };
    }
  }

  return { success: true, count: 0, logs: log };
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

    // --- DJUU PROXY FIXED ---
    if (url.pathname === '/api/djuu/stream' && request.method === 'GET') {
        const djuuId = url.searchParams.get('id');
        if (!djuuId) return new Response("Missing DJUU ID", { status: 400 });
        
        try {
            const pageUrl = `https://www.djuu.com/play/${djuuId}.html`;
            
            // 1. Fetch Page with desktop UA
            const pageResponse = await fetch(pageUrl, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                    'Referer': 'https://www.djuu.com/'
                } 
            });
            
            if (!pageResponse.ok) return new Response(`DJUU Page Error: ${pageResponse.status}`, { status: 502 });
            const html = await pageResponse.text();

            // 2. Aggressive MP3 Extraction (Handle Escaped Slashes)
            // Look for any string starting with http/https and ending in .mp3 or .m4a
            // DJUU usually stores it like: mp3:"http://..." or in a playlist variable
            let audioUrl = null;

            // Strategy: Global search for audio file extensions
            // Matches: http:\/\/domain.com\/file.mp3 OR http://domain.com/file.mp3
            const regex = /https?:\\?\/\\?\/[^"'\s<>]+\.(?:mp3|m4a)/gi;
            const matches = html.match(regex);

            if (matches && matches.length > 0) {
                // Usually the first valid MP3 link is the main track or a high quality one
                // We prefer matches that don't look like ad/tracking pixels if any
                audioUrl = matches.find(m => !m.includes('ad') && !m.includes('log')) || matches[0];
            }

            if (!audioUrl) {
                 return new Response("Could not extract audio URL from DJUU source", { status: 404 });
            }

            // Clean URL (remove JSON escaped slashes)
            audioUrl = audioUrl.replace(/\\/g, '');

            // 3. Proxy Stream
            const rangeHeader = request.headers.get('Range');
            const audioHeaders = { 
                'Referer': pageUrl, 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            };
            if (rangeHeader) audioHeaders['Range'] = rangeHeader;

            const audioResponse = await fetch(audioUrl, { headers: audioHeaders });
            
            // 4. Return
            const responseHeaders = new Headers(audioResponse.headers);
            Object.keys(corsHeaders).forEach(k => responseHeaders.set(k, corsHeaders[k]));
            
            if (!responseHeaders.get('Content-Type')) responseHeaders.set('Content-Type', 'audio/mpeg');

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
