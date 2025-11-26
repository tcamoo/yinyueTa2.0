// --- CONSTANTS ---
// High-quality fallback sets from reliable CDNs (Archive.org, etc.) to ensure the UI never looks empty
const FALLBACK_DJ_SETS = [
    {
        id: "backup_dj_1",
        title: "Ibiza Sunset Sessions Vol.1",
        djName: "Chillout Lounge",
        coverUrl: "https://picsum.photos/seed/dj1/400/400",
        fileUrl: "https://archive.org/download/IbizaChilloutLoungeMix/Ibiza%20Chillout%20Lounge%20Mix.mp3",
        duration: "58:20",
        bpm: 110,
        tags: ["Chillout", "Sunset", "House"],
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
        tags: ["House", "Classic", "90s"],
        plays: 32100
    },
    {
        id: "backup_dj_3",
        title: "Techno Bunker Berlin",
        djName: "Dark Room",
        coverUrl: "https://picsum.photos/seed/dj3/400/400",
        fileUrl: "https://archive.org/download/Techno_Mix_March_2003/01_Techno_Mix_March_2003.mp3",
        duration: "62:15",
        bpm: 135,
        tags: ["Techno", "Underground"],
        plays: 18900
    },
    {
        id: "backup_dj_4",
        title: "Drum & Bass Intelligent Mix",
        djName: "Liquid Soul",
        coverUrl: "https://picsum.photos/seed/dj4/400/400",
        fileUrl: "https://archive.org/download/LTJBukemLogicalProgressionLevel1CD1/LTJ%20Bukem%20-%20Logical%20Progression%20Level%201%20-%20CD1.mp3",
        duration: "70:00",
        bpm: 174,
        tags: ["DnB", "Liquid"],
        plays: 25600
    },
    {
        id: "backup_dj_5",
        title: "Cyberpunk Night City",
        djName: "Neon Rider",
        coverUrl: "https://picsum.photos/seed/dj5/400/400",
        fileUrl: "https://archive.org/download/BladeRunnerBlues_201705/Blade%20Runner%20Blues.mp3",
        duration: "09:56",
        bpm: 80,
        tags: ["Ambient", "Cyberpunk"],
        plays: 12400
    }
];

// --- HELPER: SCRAPE PIXABAY MUSIC ---
async function scrapePixabay(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  const CATEGORY = "dj"; // User requested specific category
  const PAGES_TO_SCRAPE = 2; 
  let newSets = [];
  let processedIds = new Set();
  let log = [];

  console.log(`[Scraper] Starting Pixabay scrape for category: ${CATEGORY}`);

  // Fake a real browser heavily to bypass basic blocking
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://pixabay.com/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
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
      
      // Strategy: Brute force regex for mp3 links in the HTML
      // Matches both escaped "https:\/\/..." and normal "https://..."
      // Pixabay audio usually resides in cdn.pixabay.com/audio/
      const regex = /https?:\\?\/\\?\/cdn\.pixabay\.com\\?\/audio\\?\/[a-zA-Z0-9\/_\-]+\.mp3/gi;
      const matches = html.match(regex) || [];
      
      for (let rawUrl of matches) {
        // Clean the URL (remove backslashes from JSON stringification)
        const fileUrl = rawUrl.replace(/\\/g, '');
        
        // Skip small preview files if possible (Pixabay doesn't usually expose small previews with same structure)
        processTrack(fileUrl, "Pixabay Mix", "DJ Set", newSets, processedIds);
      }
      
      log.push(`Page ${page}: Extracted count ${matches.length}`);
      await new Promise(r => setTimeout(r, 200)); 

    } catch (e) {
      log.push(`Page ${page} Error: ${e.message}`);
    }
  }

  // --- CRITICAL FALLBACK ---
  // If scraping fails (blocked IP, layout change), ALWAYS append hardcoded sets
  // This ensures the user NEVER sees "0 items"
  if (newSets.length < 5) {
      log.push("Scrape yielded low items. Appending Backup Data.");
      // Add backups, ensuring no ID collision
      for (const backup of FALLBACK_DJ_SETS) {
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
      
      // Merge: Add new ones that don't exist
      const uniqueNewSets = newSets.filter(s => !existingIds.has(s.id));
      const updatedSets = [...uniqueNewSets, ...existingSets].slice(0, 300); // Limit total size
      
      currentData.djSets = updatedSets;
      await env.DB.put('app_data', JSON.stringify(currentData));
      return { success: true, count: uniqueNewSets.length, total: updatedSets.length, logs: log };
    } catch (e) {
      return { success: false, message: e.message, logs: log };
    }
  }

  return { success: true, count: 0, logs: log };
}

// Helper to format track data
function processTrack(fileUrl, rawTitle, djName, list, ids) {
    // Generate ID from filename hash-ish
    const filenameMatch = fileUrl.match(/\/([^/]+)\.mp3$/);
    const filename = filenameMatch ? filenameMatch[1] : Math.random().toString(36);
    const uniqueId = `pix_${filename.replace(/[^a-zA-Z0-9]/g, '')}`;

    if (ids.has(uniqueId)) return;
    ids.add(uniqueId);

    // Try to extract date or meaningful ID from URL for title
    // e.g., .../2023/10/24/audio_12345.mp3 -> "Session 12345"
    let displayTitle = "Deep House Session";
    const dateMatch = fileUrl.match(/\/(\d{4})\/(\d{2})\//);
    if (dateMatch) {
        displayTitle = `Studio Mix ${dateMatch[1]}.${dateMatch[2]}`;
    }

    list.push({
      id: uniqueId,
      title: displayTitle,
      djName: "Pixabay Artist",
      coverUrl: `https://picsum.photos/seed/${uniqueId}/400/400`,
      fileUrl: fileUrl,
      duration: "04:00", // Placeholder
      bpm: 120 + Math.floor(Math.random() * 10),
      tags: ["Electronic", "DJ"],
      plays: Math.floor(Math.random() * 5000)
    });
}


export default {
  // --- 1. SCHEDULED SCRAPER ---
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapePixabay(env));
  },

  // --- 2. HTTP HANDLER ---
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

    // --- DJUU PROXY (DEEP SCAN FIX) ---
    if (url.pathname === '/api/djuu/stream' && request.method === 'GET') {
        const djuuId = url.searchParams.get('id');
        if (!djuuId) return new Response("Missing DJUU ID", { status: 400 });
        
        try {
            // Construct the source page URL. 
            // Often IDs are just numbers, so url is djuu.com/play/{id}.html
            const pageUrl = `https://www.djuu.com/play/${djuuId}.html`;
            
            // 1. Fetch Source Page
            const pageResponse = await fetch(pageUrl, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Referer': 'https://www.djuu.com/'
                } 
            });
            
            if (!pageResponse.ok) return new Response(`DJUU Page Error: ${pageResponse.status}`, { status: 502 });
            const html = await pageResponse.text();

            // 2. DEEP SCAN for Audio URLs
            // Find ANY string that starts with http(s) and ends with .mp3 or .m4a
            // Handles both normal slashes and escaped backslashes
            const deepRegex = /(https?:(?:\/|\\\/){2}[a-zA-Z0-9\.\-\_\/\\%]+\.(?:mp3|m4a))/gi;
            const matches = html.match(deepRegex);
            
            let audioUrl = null;
            if (matches && matches.length > 0) {
                 // Prioritize URL that contains 'djuu' or looks like a media server
                 // Clean up the URL first (remove backslashes)
                 const candidates = matches.map(m => m.replace(/\\/g, ''));
                 
                 // Heuristic: Prefer links with 'mp3' in the domain or path, ignoring common ad trackers
                 const best = candidates.find(c => !c.includes('ad') && (c.includes('djuu') || c.includes('upload')));
                 audioUrl = best || candidates[0];
            }

            if (!audioUrl) {
                // Last ditch: try to find a variable assignment like: url: "..."
                const varRegex = /["']?url["']?\s*:\s*["']([^"']+)["']/i;
                const varMatch = html.match(varRegex);
                if (varMatch) audioUrl = varMatch[1].replace(/\\/g, '');
            }

            if (!audioUrl) {
                return new Response("Could not find audio URL in DJUU source", { status: 404 });
            }

            // 3. PROXY THE STREAM
            // Crucial: Set Referer to the page URL to bypass hotlink protection
            const rangeHeader = request.headers.get('Range');
            const streamHeaders = { 
                'Referer': pageUrl, 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            };
            if (rangeHeader) streamHeaders['Range'] = rangeHeader;

            const streamResponse = await fetch(audioUrl, { headers: streamHeaders });
            
            const responseHeaders = new Headers(streamResponse.headers);
            // Copy CORS headers
            Object.keys(corsHeaders).forEach(k => responseHeaders.set(k, corsHeaders[k]));
            
            return new Response(streamResponse.body, { 
                status: streamResponse.status, 
                headers: responseHeaders 
            });

        } catch (e) { 
            return new Response(`DJUU Proxy Error: ${e.message}`, { status: 500, headers: corsHeaders }); 
        }
    }

    // --- ADMIN SCRAPER TRIGGER ---
    const isAuthorized = (req) => {
      const authHeader = req.headers.get("x-admin-key");
      // If no admin secret is set in env, allow all (dev mode), else check key
      return !env.ADMIN_SECRET || authHeader === env.ADMIN_SECRET;
    };

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

    // --- DATA SYNC ---
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

    // --- R2 UPLOAD/FILE ---
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
