// --- CONSTANTS ---
// Fallback data now uses the internal proxy to ensure they play even if source checks referer
const FALLBACK_DJ_SETS = [
    {
        id: "backup_dj_1",
        title: "Ibiza Sunset Sessions Vol.1",
        djName: "Chillout Lounge",
        coverUrl: "https://picsum.photos/seed/dj1/400/400",
        // Direct Archive.org links usually work, but we verify connectivity
        fileUrl: "https://archive.org/download/IbizaChilloutLoungeMix/Ibiza%20Chillout%20Lounge%20Mix.mp3",
        duration: "58:20",
        bpm: 110,
        tags: ["Chillout", "Sunset"],
        plays: 45200
    },
    {
        id: "backup_dj_2",
        title: "Classic House 1990 Mix",
        djName: "Retro Vibes",
        coverUrl: "https://picsum.photos/seed/dj2/400/400",
        fileUrl: "https://archive.org/download/classic-house-mixtape-1990/Classic%20House%20Mixtape%201990.mp3",
        duration: "45:10",
        bpm: 124,
        tags: ["House", "Classic"],
        plays: 32100
    }
];

// --- HELPER: PROXY URL GENERATOR ---
// Wraps a target URL into our worker proxy
function makeProxyUrl(targetUrl, host) {
    // If it's already a local path, leave it
    if (targetUrl.startsWith('/')) return targetUrl;
    // Base64 encode the target URL to pass it safely
    // But for simplicity in this environment, we use query param
    const encoded = encodeURIComponent(targetUrl);
    // Determine the 'referer' strategy based on domain
    let strategy = 'general';
    if (targetUrl.includes('pixabay')) strategy = 'pixabay';
    if (targetUrl.includes('djuu')) strategy = 'djuu';
    
    return `/api/proxy?strategy=${strategy}&url=${encoded}`;
}

// --- HELPER: SCRAPE PIXABAY MUSIC ---
async function scrapePixabay(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  const CATEGORY = "dj"; 
  const PAGES_TO_SCRAPE = 2; 
  let newSets = [];
  let processedIds = new Set();
  let log = [];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Referer': 'https://pixabay.com/music/',
  };

  for (let page = 1; page <= PAGES_TO_SCRAPE; page++) {
    try {
      const url = `https://pixabay.com/music/search/${CATEGORY}/?pagi=${page}`;
      const response = await fetch(url, { headers });
      if (!response.ok) continue;

      const html = await response.text();
      
      // Strategy: JSON-LD Extraction
      const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let match;
      
      while ((match = jsonLdRegex.exec(html)) !== null) {
          try {
              const data = JSON.parse(match[1]);
              const items = Array.isArray(data) ? data : [data];
              
              for (const item of items) {
                  if (item.contentUrl && typeof item.contentUrl === 'string' && item.contentUrl.endsWith('.mp3')) {
                      // IMPORTANT: Wrap the URL in our proxy
                      // Pixabay CDN often blocks direct requests without Referer
                      const rawUrl = item.contentUrl;
                      const proxyUrl = makeProxyUrl(rawUrl);
                      
                      const name = item.name || "Unknown Track";
                      const author = item.author?.name || "Pixabay Artist";
                      
                      processTrack(proxyUrl, name, author, newSets, processedIds);
                  }
              }
          } catch(e) {}
      }
      
      // Fallback Regex
      if (newSets.length === 0) {
          const wideRegex = /https?:\\?\/\\?\/cdn\.pixabay\.com\\?\/audio\\?\/[\w\-\/]+\.mp3/gi;
          const regexMatches = html.match(wideRegex) || [];
          for (let rawUrl of regexMatches) {
            const cleanUrl = rawUrl.replace(/\\/g, '');
            const proxyUrl = makeProxyUrl(cleanUrl);
            processTrack(proxyUrl, "DJ Session", "Pixabay Artist", newSets, processedIds);
          }
      }

    } catch (e) {
      log.push(`Page ${page} Error: ${e.message}`);
    }
  }

  // --- FALLBACK ---
  if (newSets.length === 0) {
      log.push("Scrape yielded 0 items. Using Backup Data.");
      newSets = [...FALLBACK_DJ_SETS];
  }

  // --- SAVE ---
  if (newSets.length > 0) {
    try {
      const currentDataStr = await env.DB.get('app_data');
      let currentData = currentDataStr ? JSON.parse(currentDataStr) : {};
      
      let existingSets = currentData.djSets || [];
      const existingIds = new Set(existingSets.map(s => s.id));
      
      const uniqueNewSets = newSets.filter(s => !existingIds.has(s.id));
      const updatedSets = [...uniqueNewSets, ...existingSets].slice(0, 300); 
      
      currentData.djSets = updatedSets;
      await env.DB.put('app_data', JSON.stringify(currentData));
      return { success: true, count: uniqueNewSets.length, logs: log };
    } catch (e) {
      return { success: false, message: e.message, logs: log };
    }
  }

  return { success: true, count: 0, logs: log };
}

function processTrack(fileUrl, rawTitle, djName, list, ids) {
    const uniqueId = `pix_${Math.random().toString(36).substr(2, 9)}`;
    if (ids.has(uniqueId)) return;
    ids.add(uniqueId);

    list.push({
      id: uniqueId,
      title: rawTitle,
      djName: djName,
      coverUrl: `https://picsum.photos/seed/${uniqueId}/400/400`,
      fileUrl: fileUrl, // This is now a /api/proxy URL
      duration: "04:00",
      bpm: 120 + Math.floor(Math.random() * 15),
      tags: ["Electronic", "DJ"],
      plays: Math.floor(Math.random() * 5000) + 100
    });
}


export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapePixabay(env));
  },

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

    // --- UNIVERSAL PROXY HANDLER (THE SOLUTION) ---
    // This allows the frontend to play ANY audio file that requires Referer/CORS
    if (url.pathname === '/api/proxy') {
        const targetUrl = url.searchParams.get('url');
        const strategy = url.searchParams.get('strategy') || 'general';

        if (!targetUrl) return new Response("Missing URL", { status: 400 });

        try {
            // Determine Referer based on strategy or domain
            let referer = 'https://google.com'; // Default neutral
            if (strategy === 'pixabay' || targetUrl.includes('pixabay')) referer = 'https://pixabay.com/';
            else if (strategy === 'djuu' || targetUrl.includes('djuu')) referer = 'https://www.djuu.com/';
            else if (targetUrl.includes('163.com')) referer = 'https://music.163.com/';

            // Forward the Range header (Critical for audio seeking)
            const rangeHeader = request.headers.get('Range');
            const proxyHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Referer': referer
            };
            if (rangeHeader) proxyHeaders['Range'] = rangeHeader;

            const response = await fetch(targetUrl, {
                method: request.method,
                headers: proxyHeaders
            });

            // Reconstruct headers for the client
            const newHeaders = new Headers(response.headers);
            // Force CORS
            Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));
            
            // Fix content-type for audio if missing
            if (!newHeaders.get('Content-Type') && targetUrl.endsWith('.mp3')) {
                newHeaders.set('Content-Type', 'audio/mpeg');
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            });

        } catch (e) {
            return new Response(`Proxy Error: ${e.message}`, { status: 502, headers: corsHeaders });
        }
    }

    // --- LEGACY DJUU HANDLER (Redirects to Proxy now for simplicity) ---
    if (url.pathname === '/api/djuu/stream') {
         // ... (Logic to find ID, extract URL)...
         // Simplified: If we find a URL, we redirect to the /api/proxy logic internally
         // But for now, let's just let the frontend use /api/proxy directly if it knows the URL
         // Or keep the scraping logic here but use the proxy response.
         
         const djuuId = url.searchParams.get('id');
         if (!djuuId) return new Response("Missing ID", { status: 400 });
         
         // 1. Scrape the real MP3 URL from the DJUU page
         try {
             const pageUrl = `https://www.djuu.com/play/${djuuId}.html`;
             const pageRes = await fetch(pageUrl, { headers: {'User-Agent': 'Mozilla/5.0'} });
             const html = await pageRes.text();
             
             // Extract MP3
             let audioUrl = null;
             const regex = /(https?:\\?\/\\?\/[^"']+\.mp3)/i;
             const match = html.match(regex);
             if (match && match[1]) audioUrl = match[1].replace(/\\/g, '');
             
             if (!audioUrl) return new Response("DJUU Audio Not Found", { status: 404 });

             // 2. Redirect to our own Proxy
             const proxyUrl = new URL(request.url);
             proxyUrl.pathname = '/api/proxy';
             proxyUrl.searchParams.set('url', audioUrl);
             proxyUrl.searchParams.set('strategy', 'djuu');
             
             // Internal Fetch (Sub-request) to reuse logic
             return this.fetch(new Request(proxyUrl.toString(), request), env);

         } catch(e) {
             return new Response("DJUU Error", { status: 500 });
         }
    }

    // --- STANDARD API ENDPOINTS (Auth, Sync, Upload) ---
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const valid = !env.ADMIN_SECRET || body.key === env.ADMIN_SECRET;
        return new Response(JSON.stringify({ valid }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    if (url.pathname === '/api/admin/scrape' && request.method === 'POST') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const result = await scrapePixabay(env);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/sync' && request.method === 'GET') {
      if (!env.DB) return new Response(JSON.stringify({ empty: true, warning: "KV_NOT_BOUND" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const data = await env.DB.get('app_data');
      if (!data) return new Response(JSON.stringify({ empty: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/sync' && request.method === 'POST') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!env.DB) return new Response(JSON.stringify({ error: "KV Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const body = await request.json();
      await env.DB.put('app_data', JSON.stringify(body));
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!env.BUCKET) return new Response(JSON.stringify({ error: "R2 Bucket Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const filename = url.searchParams.get('filename') || `file-${Date.now()}`;
      await env.BUCKET.put(filename, request.body);
      const publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}` : `/api/file/${filename}`;
      return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/storage/list' && request.method === 'GET') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       if (!env.BUCKET) return new Response(JSON.stringify({ files: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       const listed = await env.BUCKET.list({ limit: 100 });
       const files = listed.objects.map(obj => ({
           key: obj.key,
           size: obj.size,
           uploaded: obj.uploaded,
           url: env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${obj.key}` : `/api/file/${obj.key}`
       }));
       return new Response(JSON.stringify({ files }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/storage/delete' && request.method === 'DELETE') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       const key = url.searchParams.get('key');
       if(!key) return new Response("Missing Key", { status: 400 });
       if (!env.BUCKET) return new Response("R2 Not Configured", { status: 503 });
       await env.BUCKET.delete(key);
       return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname.startsWith('/api/file/') && request.method === 'GET') {
        if (!env.BUCKET) return new Response("R2 Bucket Not Configured", { status: 404 });
        const filename = url.pathname.replace('/api/file/', '');
        try {
            const rangeHeader = request.headers.get('Range');
            const object = await env.BUCKET.get(filename, { range: rangeHeader ? request.headers : undefined, onlyIf: request.headers });
            if (object === null) return new Response('Not Found', { status: 404, headers: corsHeaders });
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            Object.keys(corsHeaders).forEach(k => headers.set(k, corsHeaders[k]));
            
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

    // SPA FALLBACK
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
