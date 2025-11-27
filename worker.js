
// --- CONSTANTS ---
// High-availability Fallback Sets (Using Archive.org but proxy will ensure they play)
// These are used ONLY if the scraper fails entirely.
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
    }
];

// Hardcoded HOT Playlist IDs to scrape if discovery page fails
// These are reliable Netease Electronic/Dance playlists
const HOT_PLAYLIST_IDS = [
    "924376402", // Electronic Hot
    "2075677249", // Club Life
    "444267215", // Deep House
    "3778678", // Hot List
    "2829883282" // Driving
];

// --- HELPER: PROXY URL GENERATOR ---
function makeProxyUrl(targetUrl, strategy = 'general') {
    if (!targetUrl) return '';
    if (targetUrl.startsWith('/')) return targetUrl;
    return `/api/proxy?strategy=${strategy}&url=${encodeURIComponent(targetUrl)}`;
}

// --- HELPER: SCRAPE NETEASE MUSIC (DANCE CATEGORY) ---
async function scrapeNetease(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  // Headers specifically mimick a real browser to avoid Netease blocking
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://music.163.com/',
    'Cookie': 'NMTID=00O; os=pc;'
  };

  let log = [];
  let newSets = [];
  let processedIds = new Set();
  
  // Strategy: 
  // 1. Try to scrape the discovery page for dynamic playlists.
  // 2. If that fails (returns 0 playlists), fall back to hardcoded HOT_PLAYLIST_IDS.

  let targetPlaylists = [];

  try {
      log.push(`Strategy 1: Fetching Discovery Page...`);
      const LIST_URL = "https://music.163.com/discover/playlist/?cat=%E8%88%9E%E6%9B%B2&limit=35&order=hot";
      const listRes = await fetch(LIST_URL, { headers });
      
      if (listRes.ok) {
          const listHtml = await listRes.text();
          const playlistRegex = /<a title="([^"]+)" href="\/playlist\?id=(\d+)"/g;
          let match;
          while ((match = playlistRegex.exec(listHtml)) !== null) {
              targetPlaylists.push({ title: match[1], id: match[2] });
          }
      }
      
      log.push(`Found ${targetPlaylists.length} playlists via discovery.`);
  } catch(e) {
      log.push(`Discovery fetch error: ${e.message}`);
  }

  // If Discovery failed, use Hardcoded
  if (targetPlaylists.length === 0) {
      log.push(`Strategy 2: Using Hardcoded Playlists.`);
      targetPlaylists = HOT_PLAYLIST_IDS.map(id => ({ title: "Hot Playlist", id }));
  }

  if (targetPlaylists.length > 0) {
      // Shuffle and pick 3 to keep it fast but varied
      const shuffled = targetPlaylists.sort(() => 0.5 - Math.random()).slice(0, 3);

      for (const pl of shuffled) {
          try {
              log.push(`Scraping Playlist: ${pl.id}`);
              const detailUrl = `https://music.163.com/playlist?id=${pl.id}`;
              const detailRes = await fetch(detailUrl, { headers });
              const detailHtml = await detailRes.text();

              const jsonRegex = /<textarea id="song-list-pre-cache" style="display:none;">([\s\S]*?)<\/textarea>/;
              const jsonMatch = detailHtml.match(jsonRegex);

              if (jsonMatch && jsonMatch[1]) {
                  const rawSongs = JSON.parse(jsonMatch[1]);
                  const topSongs = rawSongs.slice(0, 15); // Take top 15

                  for (const song of topSongs) {
                      const neteaseId = song.id;
                      // Direct Netease MP3 URL (Proxy will handle the 302 redirect)
                      const rawMp3Url = `https://music.163.com/song/media/outer/url?id=${neteaseId}.mp3`;
                      // Use netease strategy for proxy
                      const proxyUrl = makeProxyUrl(rawMp3Url, 'netease');

                      const uniqueId = `ne_${neteaseId}`;
                      const artistName = song.artists ? song.artists.map(a => a.name).join('/') : 'Unknown DJ';
                      
                      // Better Cover URL
                      const coverUrl = song.album && song.album.picUrl 
                          ? song.album.picUrl.replace('http:', 'https:') + '?param=600y600' 
                          : `https://picsum.photos/seed/${uniqueId}/400/400`;

                      if (!processedIds.has(uniqueId)) {
                          newSets.push({
                              id: uniqueId,
                              title: song.name,
                              djName: artistName,
                              coverUrl: coverUrl,
                              fileUrl: proxyUrl, 
                              neteaseId: neteaseId.toString(),
                              duration: "03:30", 
                              bpm: 128, 
                              tags: ["Dance", "Club", "Netease"],
                              plays: Math.floor(Math.random() * 50000) + 1000
                          });
                          processedIds.add(uniqueId);
                      }
                  }
              }
          } catch(e) {
              log.push(`Playlist ${pl.id} error: ${e.message}`);
          }
      }
  }

  // Final Fallback if EVERYTHING failed
  if (newSets.length === 0) {
      log.push("All Netease scraping failed. Using Archive.org backup.");
      newSets = [...FALLBACK_DJ_SETS];
  }

  // Save to DB
  if (newSets.length > 0) {
      try {
          const currentDataStr = await env.DB.get('app_data');
          let currentData = currentDataStr ? JSON.parse(currentDataStr) : {};

          // Merge logic: Add new sets to the top
          let existingSets = currentData.djSets || [];
          
          // Deduplicate
          const existingIds = new Set(existingSets.map(s => s.id));
          const uniqueNewSets = newSets.filter(s => !existingIds.has(s.id));
          
          if (uniqueNewSets.length > 0) {
             const merged = [...uniqueNewSets, ...existingSets].slice(0, 1000);
             currentData.djSets = merged;
             await env.DB.put('app_data', JSON.stringify(currentData));
             return { success: true, count: uniqueNewSets.length, logs: log };
          } else {
             return { success: true, count: 0, logs: [...log, "Duplicate content ignored"] };
          }
      } catch (e) {
          return { success: false, message: e.message, logs: log };
      }
  }

  return { success: true, count: 0, logs: log };
}

export default {
  // --- SCHEDULED TASK (CRON) ---
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scrapeNetease(env));
  },

  // --- HTTP HANDLER ---
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

    // --- UNIVERSAL AUDIO PROXY ---
    if (url.pathname === '/api/proxy') {
        const targetUrl = url.searchParams.get('url');
        const strategy = url.searchParams.get('strategy') || 'general';

        if (!targetUrl) return new Response("Missing URL", { status: 400 });

        try {
            let referer = 'https://google.com';
            let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
            let cookie = '';

            // Strict headers for Netease
            if (strategy === 'netease' || targetUrl.includes('163.com') || targetUrl.includes('126.net')) {
                referer = 'https://music.163.com/';
                userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
                cookie = 'os=pc; appver=2.0; channel=netease;';
            }

            const proxyHeaders = new Headers();
            proxyHeaders.set('User-Agent', userAgent);
            proxyHeaders.set('Referer', referer);
            if (cookie) proxyHeaders.set('Cookie', cookie);
            
            // Pass range header for seeking
            const range = request.headers.get('Range');
            if (range) proxyHeaders.set('Range', range);

            const response = await fetch(targetUrl, {
                method: request.method,
                headers: proxyHeaders,
                redirect: 'follow' 
            });

            // Reconstruct headers for CORS
            const newHeaders = new Headers(response.headers);
            Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));
            
            // Force content type if missing
            const contentType = newHeaders.get('Content-Type');
            if ((targetUrl.endsWith('.mp3') || targetUrl.includes('.mp3')) && (!contentType || contentType.includes('text'))) {
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

    // --- ADMIN SCRAPER ---
    if (url.pathname === '/api/admin/scrape' && request.method === 'POST') {
      if (!isAuthorized(request)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const result = await scrapeNetease(env);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- DATA SYNC (KV) ---
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

    // --- ADMIN LINK VALIDATOR ---
    if (url.pathname === '/api/admin/validate' && request.method === 'POST') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       try {
           const { targetUrl } = await request.json();
           const res = await fetch(targetUrl, { method: 'HEAD', headers: { 'User-Agent': 'CF-Health' } });
           return new Response(JSON.stringify({ valid: res.ok, status: res.status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       } catch (e) {
           return new Response(JSON.stringify({ valid: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       }
    }
    
    // --- AUTH ---
    if (url.pathname === '/api/auth' && request.method === 'POST') {
        try {
          const body = await request.json();
          const valid = !env.ADMIN_SECRET || body.key === env.ADMIN_SECRET;
          return new Response(JSON.stringify({ valid }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    // --- R2 STORAGE API (SIMPLIFIED) ---
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!env.BUCKET) return new Response(JSON.stringify({ error: "R2 Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const filename = url.searchParams.get('filename') || `file-${Date.now()}`;
      await env.BUCKET.put(filename, request.body);
      const publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}` : `/api/file/${filename}`;
      return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname.startsWith('/api/file/') && request.method === 'GET') {
        if (!env.BUCKET) return new Response("R2 Not Configured", { status: 404 });
        const filename = url.pathname.replace('/api/file/', '');
        const object = await env.BUCKET.get(filename);
        if (!object) return new Response('Not Found', { status: 404 });
        return new Response(object.body, { headers: { ...corsHeaders, 'etag': object.httpEtag } });
    }

    // --- ASSETS ---
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
