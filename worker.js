
// --- CONSTANTS ---
const FALLBACK_DJ_SETS = [
    {
        id: "pix_backup_1",
        title: "Future Garage Sessions Vol.1",
        djName: "Pixabay Mix",
        coverUrl: "https://cdn.pixabay.com/audio/2022/05/27/18-24-34-457_200x200.jpg",
        fileUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1804fdf29d.mp3",
        duration: "04:20",
        bpm: 130,
        tags: ["Future Garage", "Deep"],
        plays: 15420
    },
    {
        id: "pix_backup_2",
        title: "Cyberpunk City Ambience",
        djName: "System Glitch",
        coverUrl: "https://cdn.pixabay.com/audio/2022/03/10/17-38-41-692_200x200.jpg",
        fileUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3",
        duration: "05:15",
        bpm: 90,
        tags: ["Cyberpunk", "Ambient"],
        plays: 8900
    },
    {
        id: "pix_backup_3",
        title: "Deep House Summer Mix",
        djName: "Sunset Vibes",
        coverUrl: "https://cdn.pixabay.com/audio/2022/04/22/16-24-10-864_200x200.jpg",
        fileUrl: "https://cdn.pixabay.com/audio/2022/04/22/audio_145903d650.mp3",
        duration: "03:45",
        bpm: 124,
        tags: ["House", "Summer"],
        plays: 23100
    },
    {
        id: "pix_backup_4",
        title: "Acid Techno Bunker",
        djName: "Rave Bot",
        coverUrl: "https://cdn.pixabay.com/audio/2023/01/18/14-38-08-333_200x200.jpg",
        fileUrl: "https://cdn.pixabay.com/audio/2023/01/18/audio_2f2220d913.mp3",
        duration: "06:10",
        bpm: 140,
        tags: ["Techno", "Acid"],
        plays: 5600
    }
];

// --- HELPER: SCRAPE PIXABAY MUSIC ---
async function scrapePixabay(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  const CATEGORY = "ambient"; // Changed to ambient/electronic for better hit rate
  const PAGES_TO_SCRAPE = 3; 
  let newSets = [];
  let processedIds = new Set();
  let log = [];

  console.log(`[Scraper] Starting Pixabay scrape for category: ${CATEGORY}`);

  // Advanced Browser Headers to bypass simple bot detection
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://pixabay.com/',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
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
      
      // --- ROBUST REGEX STRATEGY ---
      // 1. Look for direct mp3 links in the HTML source (attributes or scripts)
      // Matches both standard and JSON-escaped slashes
      // Example: https://cdn.pixabay.com/audio/2023/10/22/audio_123.mp3
      const wideRegex = /https?:\\?\/\\?\/cdn\.pixabay\.com\\?\/audio\\?\/[^"'\s<>]+\.mp3/gi;
      
      const matches = html.match(wideRegex) || [];
      const uniqueUrls = [...new Set(matches)];

      for (let rawUrl of uniqueUrls) {
        // Clean URL: remove JSON escape slashes
        const fileUrl = rawUrl.replace(/\\/g, '');
        
        // Skip tiny previews if possible (optional logic)
        
        // Generate a stable ID
        // Extract filename: audio_123456.mp3
        const filenameMatch = fileUrl.match(/\/([^/]+)\.mp3$/);
        const filename = filenameMatch ? filenameMatch[1] : Math.random().toString(36);
        const uniqueId = `pix_${filename.replace(/[^a-zA-Z0-9]/g, '')}`;

        if (processedIds.has(uniqueId)) continue;
        processedIds.add(uniqueId);

        // Generate Human Readable Title
        let cleanTitle = filename
          .replace(/^audio_/, '')
          .replace(/[0-9-]/g, ' ')
          .trim();
        
        if (cleanTitle.length < 3) cleanTitle = `Session ${Math.floor(Math.random() * 1000)}`;
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

        newSets.push({
          id: uniqueId,
          title: cleanTitle,
          djName: 'Pixabay Artist',
          coverUrl: `https://picsum.photos/seed/${uniqueId}/400/400`,
          fileUrl: fileUrl,
          duration: "03:00", // Pixabay doesn't expose duration in URL, using generic
          bpm: 120 + Math.floor(Math.random() * 15),
          tags: ["Electronic", "Royalty Free"],
          plays: Math.floor(Math.random() * 5000) + 1000
        });
      }
      
      log.push(`Page ${page}: Found ${uniqueUrls.length} items`);
      await new Promise(r => setTimeout(r, 500)); // Be polite

    } catch (e) {
      log.push(`Page ${page} Error: ${e.message}`);
    }
  }

  // --- FALLBACK STRATEGY ---
  // If we got 0 items (likely blocked), load the hardcoded fallback sets
  // This ensures the user NEVER sees an empty list.
  if (newSets.length === 0) {
      log.push("Scrape yielded 0 items. Using Backup Data Source.");
      newSets = [...FALLBACK_DJ_SETS];
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
      
      // Merge: New sets go to the TOP
      const updatedSets = [...uniqueNewSets, ...existingSets].slice(0, 300); 
      currentData.djSets = updatedSets;
      
      await env.DB.put('app_data', JSON.stringify(currentData));
      return { success: true, count: uniqueNewSets.length, logs: log, usedFallback: uniqueNewSets.length === 0 };
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

    // --- DJUU PROXY REWRITTEN (DEEP SEARCH) ---
    if (url.pathname === '/api/djuu/stream' && request.method === 'GET') {
        const djuuId = url.searchParams.get('id');
        if (!djuuId) return new Response("Missing DJUU ID", { status: 400 });
        
        try {
            const pageUrl = `https://www.djuu.com/play/${djuuId}.html`;
            
            // 1. Fetch Page with desktop UA and Referer
            const pageResponse = await fetch(pageUrl, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
                    'Referer': 'https://www.djuu.com/',
                    'Accept': 'text/html,application/xhtml+xml'
                } 
            });
            
            if (!pageResponse.ok) return new Response(`DJUU Page Error: ${pageResponse.status}`, { status: 502 });
            const html = await pageResponse.text();

            // 2. AGGRESSIVE URL EXTRACTION
            // DJUU links often look like: http://mp3.djuu.com/group1/M00/../file.mp3
            // Or inside JSON: "mp3":"http:\/\/..."
            
            // Regex to catch http/https links ending in mp3/m4a, handling escaped slashes
            const regex = /(https?:\\?\/\\?\/[^"'\s<>]+\.(?:mp3|m4a))/gi;
            const matches = html.match(regex);

            let audioUrl = null;
            if (matches && matches.length > 0) {
                // Filter out likely ads or tracking pixels
                // Prefer links containing 'mp3.djuu.com' or 'music'
                const likelyMusic = matches.find(m => m.includes('mp3.djuu') || m.includes('audio') || m.includes('music'));
                audioUrl = likelyMusic || matches[0];
            }

            if (!audioUrl) {
                // Fallback attempt: sometimes links are relative or specific structure
                // Just return 404 so the client knows it failed
                return new Response("Could not find audio URL in DJUU source", { status: 404 });
            }

            // 3. Clean the URL
            audioUrl = audioUrl.replace(/\\/g, ''); // Unescape JSON slashes
            // Ensure protocol
            if (audioUrl.startsWith('//')) audioUrl = 'https:' + audioUrl;

            // 4. Proxy Stream with CORRECT HEADERS
            // DJUU servers often check the Referer strictly
            const rangeHeader = request.headers.get('Range');
            const audioHeaders = { 
                'Referer': pageUrl, // Crucial
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            };
            if (rangeHeader) audioHeaders['Range'] = rangeHeader;

            const audioResponse = await fetch(audioUrl, { headers: audioHeaders });
            
            // 5. Stream Response Back
            const responseHeaders = new Headers(audioResponse.headers);
            Object.keys(corsHeaders).forEach(k => responseHeaders.set(k, corsHeaders[k]));
            
            // Force content type if missing
            if (!responseHeaders.get('Content-Type')) responseHeaders.set('Content-Type', 'audio/mpeg');

            return new Response(audioResponse.body, { 
                status: audioResponse.status, 
                headers: responseHeaders 
            });

        } catch (e) { 
            return new Response(`DJUU Proxy Error: ${e.message}`, { status: 500 }); 
        }
    }

    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const providedKey = body.key;
        if (!env.ADMIN_SECRET) return new Response(JSON.stringify({ valid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (providedKey === env.ADMIN_SECRET) return new Response(JSON.stringify({ valid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        else return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
