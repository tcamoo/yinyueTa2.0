
// --- CONSTANTS ---
// High-availability Fallback Sets (Hosting on Archive.org to guarantee playback)
const FALLBACK_DJ_SETS = [
    {
        id: "backup_mix_01",
        title: "Ibiza Sunset Lounge Vol.1",
        djName: "Chillout Sessions",
        coverUrl: "https://picsum.photos/seed/ibiza1/400/400",
        fileUrl: "https://archive.org/download/IbizaChilloutLoungeMix/Ibiza%20Chillout%20Lounge%20Mix.mp3",
        duration: "58:20",
        bpm: 105,
        tags: ["Chillout", "Lounge"],
        plays: 45200
    },
    {
        id: "backup_mix_02",
        title: "Classic House 1990",
        djName: "Retro Vibes",
        coverUrl: "https://picsum.photos/seed/house90/400/400",
        fileUrl: "https://archive.org/download/classic-house-mixtape-1990/Classic%20House%20Mixtape%201990.mp3",
        duration: "45:10",
        bpm: 124,
        tags: ["House", "Classic"],
        plays: 32100
    },
    {
        id: "backup_mix_03",
        title: "Techno Bunker Berlin",
        djName: "Underground",
        coverUrl: "https://picsum.photos/seed/techno1/400/400",
        fileUrl: "https://archive.org/download/Techno_Mix_March_2003/01_Techno_Mix_March_2003.mp3",
        duration: "62:15",
        bpm: 135,
        tags: ["Techno", "Dark"],
        plays: 18900
    },
    {
        id: "backup_mix_04",
        title: "Liquid Drum & Bass",
        djName: "Atmospheric",
        coverUrl: "https://picsum.photos/seed/dnb1/400/400",
        fileUrl: "https://archive.org/download/LTJBukemLogicalProgressionLevel1CD1/LTJ%20Bukem%20-%20Logical%20Progression%20Level%201%20-%20CD1.mp3",
        duration: "70:00",
        bpm: 174,
        tags: ["DnB", "Liquid"],
        plays: 25600
    }
];

// --- HELPER: PROXY URL GENERATOR ---
function makeProxyUrl(targetUrl, strategy = 'general') {
    if (!targetUrl) return '';
    if (targetUrl.startsWith('/')) return targetUrl;
    // Simple encoding to pass URL as param
    return `/api/proxy?strategy=${strategy}&url=${encodeURIComponent(targetUrl)}`;
}

// --- HELPER: SCRAPE PIXABAY MUSIC ---
async function scrapePixabay(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  const CATEGORY = "dj"; // Target specific category
  const PAGES_TO_SCRAPE = 2; 
  let newSets = [];
  let processedIds = new Set();
  let log = [];

  // Use a real browser User-Agent
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://pixabay.com/music/',
  };

  for (let page = 1; page <= PAGES_TO_SCRAPE; page++) {
    try {
      // 1. Fetch search page
      const url = `https://pixabay.com/music/search/${CATEGORY}/?pagi=${page}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        log.push(`Page ${page} failed: ${response.status}`);
        continue;
      }

      const html = await response.text();
      
      // 2. Parse JSON-LD (Most reliable way to get Main Content vs Footer Sound Effects)
      // Pixabay puts the track list in a <script type="application/ld+json"> tag
      const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let match;
      let foundInJson = false;

      while ((match = jsonLdRegex.exec(html)) !== null) {
          try {
              const data = JSON.parse(match[1]);
              const items = Array.isArray(data) ? data : [data];
              
              for (const item of items) {
                  // We only want AudioObjects that look like music
                  // Some sound effects might be mixed in, but usually on /search/dj/ page, main items are music
                  if (item.contentUrl && typeof item.contentUrl === 'string' && item.contentUrl.endsWith('.mp3')) {
                      
                      const rawUrl = item.contentUrl;
                      
                      // Skip if URL looks like a tiny preview or sound effect (heuristic)
                      // But Pixabay URLs are opaque, so we trust the 'contentUrl' property of the main list
                      
                      const proxyUrl = makeProxyUrl(rawUrl, 'pixabay');
                      const name = item.name || "Unknown Track";
                      const author = item.author?.name || "Pixabay Artist";
                      const duration = item.duration || "03:00"; // ISO format sometimes

                      processTrack(proxyUrl, name, author, newSets, processedIds);
                      foundInJson = true;
                  }
              }
          } catch(e) {}
      }
      
      // 3. Fallback Regex (Only if JSON-LD failed)
      // Tries to find MP3 links, but we must be careful not to grab footer SFX
      if (!foundInJson) {
          // Look for links that contain 'audio' path. 
          // Note: escaped slashes in HTML source: https:\/\/cdn...
          const wideRegex = /https?:\\?\/\\?\/cdn\.pixabay\.com\\?\/audio\\?\/[\w\-\/]+\.mp3/gi;
          const regexMatches = html.match(wideRegex) || [];
          
          // Deduplicate
          const uniqueUrls = [...new Set(regexMatches)];
          
          for (let rawUrl of uniqueUrls) {
            const cleanUrl = rawUrl.replace(/\\/g, '');
            // Wrap in proxy
            const proxyUrl = makeProxyUrl(cleanUrl, 'pixabay');
            processTrack(proxyUrl, "DJ Mix Session", "Pixabay Artist", newSets, processedIds);
          }
      }

      log.push(`Page ${page}: Extracted count ${newSets.length}`);

    } catch (e) {
      log.push(`Page ${page} Error: ${e.message}`);
    }
  }

  // --- CRITICAL FALLBACK ---
  // If scraping yields nothing (blocked) or very few items, inject high-quality backups.
  // This ensures the site is NEVER empty or broken.
  if (newSets.length < 5) {
      log.push("Scrape yielded low items. Appending Archive.org Backups.");
      for (const backup of FALLBACK_DJ_SETS) {
          // Check for ID collision
          if (!processedIds.has(backup.id)) {
              newSets.push(backup);
              processedIds.add(backup.id);
          }
      }
  }

  // --- SAVE TO KV ---
  if (newSets.length > 0) {
    try {
      const currentDataStr = await env.DB.get('app_data');
      let currentData = currentDataStr ? JSON.parse(currentDataStr) : {};
      
      let existingSets = currentData.djSets || [];
      const existingIds = new Set(existingSets.map(s => s.id));
      
      // Add new ones
      const uniqueNewSets = newSets.filter(s => !existingIds.has(s.id));
      // Keep list fresh, limit size
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
    // Generate deterministic ID from URL
    let filename = "track";
    try {
        const parts = fileUrl.split('/');
        // Handle both proxy URLs and raw URLs
        const lastPart = parts[parts.length - 1];
        filename = lastPart.split('?')[0]; // remove query params
    } catch(e) {}
    
    const uniqueId = `pix_${filename.replace(/[^a-zA-Z0-9]/g, '').slice(-10)}_${Math.floor(Math.random()*1000)}`;

    if (ids.has(uniqueId)) return;
    ids.add(uniqueId);

    list.push({
      id: uniqueId,
      title: rawTitle.replace(/_/g, ' ').replace(/-/g, ' '),
      djName: djName,
      coverUrl: `https://picsum.photos/seed/${uniqueId}/400/400`,
      fileUrl: fileUrl,
      duration: "04:00", // Placeholder if not found
      bpm: 120 + Math.floor(Math.random() * 15),
      tags: ["Electronic", "DJ", "Mix"],
      plays: Math.floor(Math.random() * 5000) + 500
    });
}


export default {
  // --- SCHEDULED TASK ---
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapePixabay(env));
  },

  // --- HTTP HANDLER ---
  async fetch(request, env) {
    const url = new URL(request.url);

    // Common CORS headers
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

    // --- UNIVERSAL PROXY (Fixes Pixabay/DJUU playback) ---
    if (url.pathname === '/api/proxy') {
        const targetUrl = url.searchParams.get('url');
        const strategy = url.searchParams.get('strategy') || 'general';

        if (!targetUrl) return new Response("Missing URL", { status: 400 });

        try {
            // Determine best Referer based on strategy
            let referer = 'https://google.com';
            let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
            
            if (strategy === 'pixabay' || targetUrl.includes('pixabay')) {
                referer = 'https://pixabay.com/';
            } else if (strategy === 'djuu' || targetUrl.includes('djuu')) {
                referer = 'https://www.djuu.com/';
            }

            const proxyHeaders = new Headers();
            proxyHeaders.set('User-Agent', userAgent);
            proxyHeaders.set('Referer', referer);
            
            // Forward Range header for seeking
            const range = request.headers.get('Range');
            if (range) proxyHeaders.set('Range', range);

            const response = await fetch(targetUrl, {
                method: request.method,
                headers: proxyHeaders
            });

            // Reconstruct response with CORS
            const newHeaders = new Headers(response.headers);
            Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));
            
            // Ensure audio type
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

    // --- DJUU PARSER & PROXY REDIRECT ---
    if (url.pathname === '/api/djuu/stream') {
         const djuuId = url.searchParams.get('id');
         if (!djuuId) return new Response("Missing ID", { status: 400 });
         
         try {
             const pageUrl = `https://www.djuu.com/play/${djuuId}.html`;
             const pageRes = await fetch(pageUrl, { 
                 headers: { 'User-Agent': 'Mozilla/5.0' } 
             });
             const html = await pageRes.text();
             
             // Extract MP3 URL (Regex for "file":"..." or "url":"..." or raw http)
             let audioUrl = null;
             // Regex to find http links ending in mp3/m4a inside quotes, handling escaped slashes
             const regex = /["'](https?:\\?\/\\?\/[^"']+\.(?:mp3|m4a))["']/i;
             const match = html.match(regex);
             
             if (match && match[1]) {
                 audioUrl = match[1].replace(/\\/g, '');
             }

             if (!audioUrl) return new Response("DJUU Audio Not Found", { status: 404 });

             // Redirect internal logic to the Proxy handler
             const proxyUrl = new URL(request.url);
             proxyUrl.pathname = '/api/proxy';
             proxyUrl.searchParams.set('url', audioUrl);
             proxyUrl.searchParams.set('strategy', 'djuu');
             
             // Internal Sub-request
             return this.fetch(new Request(proxyUrl.toString(), request), env);

         } catch(e) {
             return new Response("DJUU Parsing Error", { status: 500 });
         }
    }

    // --- ADMIN SCRAPER TRIGGER ---
    if (url.pathname === '/api/admin/scrape' && request.method === 'POST') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const result = await scrapePixabay(env);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- AUTH ---
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const valid = !env.ADMIN_SECRET || body.key === env.ADMIN_SECRET;
        return new Response(JSON.stringify({ valid }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    // --- DATA SYNC ---
    if (url.pathname === '/api/sync') {
        if (!env.DB) return new Response(JSON.stringify({ error: "KV Not Configured" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
        if (request.method === 'GET') {
            const data = await env.DB.get('app_data');
            return new Response(data || JSON.stringify({ empty: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        if (request.method === 'POST') {
            if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            const body = await request.json();
            await env.DB.put('app_data', JSON.stringify(body));
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    // --- R2 STORAGE ---
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!env.BUCKET) return new Response(JSON.stringify({ error: "R2 Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      const filename = url.searchParams.get('filename') || `file-${Date.now()}`;
      await env.BUCKET.put(filename, request.body);
      const publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}` : `/api/file/${filename}`;
      return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // R2 List
    if (url.pathname === '/api/storage/list' && request.method === 'GET') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       if (!env.BUCKET) return new Response(JSON.stringify({ files: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       
       const listed = await env.BUCKET.list({ limit: 200 });
       const files = listed.objects.map(obj => ({
           key: obj.key,
           size: obj.size,
           uploaded: obj.uploaded,
           url: env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${obj.key}` : `/api/file/${obj.key}`
       }));
       return new Response(JSON.stringify({ files }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // R2 Delete
    if (url.pathname === '/api/storage/delete' && request.method === 'DELETE') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       const key = url.searchParams.get('key');
       if (!env.BUCKET) return new Response("R2 Not Configured", { status: 503 });
       await env.BUCKET.delete(key);
       return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // R2 File Stream (Public Proxy)
    if (url.pathname.startsWith('/api/file/') && request.method === 'GET') {
        if (!env.BUCKET) return new Response("R2 Not Configured", { status: 404 });
        const filename = url.pathname.replace('/api/file/', '');
        try {
            const object = await env.BUCKET.get(filename, { range: request.headers, onlyIf: request.headers });
            if (!object) return new Response('Not Found', { status: 404 });
            
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('etag', object.httpEtag);
            Object.keys(corsHeaders).forEach(k => headers.set(k, corsHeaders[k]));
            
            return new Response(object.body, { 
                headers, 
                status: object.range ? 206 : 200 
            });
        } catch(e) { return new Response("Stream Error", { status: 500 }); }
    }

    // --- ASSETS FALLBACK ---
    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status >= 200 && response.status < 400) return response;
      if (response.status === 404 && !url.pathname.startsWith('/api/')) {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return response;
    } catch (e) { return new Response("Internal Error", { status: 500 }); }
  },
};
