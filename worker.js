
// --- CONSTANTS ---
// High-availability Fallback Sets (Hosting on Archive.org to guarantee playback if Netease fails)
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

// --- HELPER: PROXY URL GENERATOR ---
function makeProxyUrl(targetUrl, strategy = 'general') {
    if (!targetUrl) return '';
    // If it's already a local path, return as is
    if (targetUrl.startsWith('/')) return targetUrl;
    return `/api/proxy?strategy=${strategy}&url=${encodeURIComponent(targetUrl)}`;
}

// --- HELPER: SCRAPE NETEASE MUSIC (DANCE CATEGORY) ---
async function scrapeNetease(env) {
  if (!env.DB) return { success: false, message: "KV DB not bound" };

  // Target: "Dance" (舞曲) category playlists
  const LIST_URL = "https://music.163.com/discover/playlist/?cat=%E8%88%9E%E6%9B%B2&limit=35&order=hot";
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://music.163.com/',
  };

  let log = [];
  let newSets = [];
  let processedIds = new Set();

  try {
      // 1. Get the list of playlists
      log.push(`Fetching Playlist Directory...`);
      const listRes = await fetch(LIST_URL, { headers });
      if (!listRes.ok) throw new Error(`List fetch failed: ${listRes.status}`);
      const listHtml = await listRes.text();

      // Regex to find playlist IDs
      const playlistRegex = /<a title="([^"]+)" href="\/playlist\?id=(\d+)"/g;
      const playlists = [];
      let match;
      while ((match = playlistRegex.exec(listHtml)) !== null) {
          playlists.push({ title: match[1], id: match[2] });
      }

      log.push(`Found ${playlists.length} playlists.`);

      if (playlists.length === 0) throw new Error("No playlists found in HTML");

      // 2. Randomly select 2 playlists to scrape deep (avoiding timeouts)
      const shuffled = playlists.sort(() => 0.5 - Math.random()).slice(0, 2);

      for (const pl of shuffled) {
          log.push(`Scraping Playlist: ${pl.title} (${pl.id})`);
          
          const detailUrl = `https://music.163.com/playlist?id=${pl.id}`;
          const detailRes = await fetch(detailUrl, { headers });
          const detailHtml = await detailRes.text();

          // 3. Extract Songs from the magical textarea
          const jsonRegex = /<textarea id="song-list-pre-cache" style="display:none;">([\s\S]*?)<\/textarea>/;
          const jsonMatch = detailHtml.match(jsonRegex);

          if (jsonMatch && jsonMatch[1]) {
              try {
                  const rawSongs = JSON.parse(jsonMatch[1]);
                  const topSongs = rawSongs.slice(0, 10);

                  for (const song of topSongs) {
                      const neteaseId = song.id;
                      // IMPORTANT: Use HTTPS for Netease URL to avoid mixed content warnings in proxy
                      const rawMp3Url = `https://music.163.com/song/media/outer/url?id=${neteaseId}.mp3`;
                      
                      // Wrap in our proxy
                      const proxyUrl = makeProxyUrl(rawMp3Url, 'netease');

                      const uniqueId = `ne_${neteaseId}`;
                      
                      const artistName = song.artists ? song.artists.map(a => a.name).join('/') : 'Unknown DJ';
                      
                      const coverUrl = song.album && song.album.picUrl 
                          ? song.album.picUrl.replace('http:', 'https:') + '?param=400y400' 
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
                              plays: Math.floor(Math.random() * 20000) + 1000
                          });
                          processedIds.add(uniqueId);
                      }
                  }
              } catch (e) {
                  log.push(`Failed to parse JSON for playlist ${pl.id}: ${e.message}`);
              }
          } else {
              log.push(`No song-list textarea found for playlist ${pl.id}`);
          }
      }

  } catch (e) {
      log.push(`Critical Error: ${e.message}`);
  }

  // --- FALLBACK INJECTION ---
  if (newSets.length === 0) {
      log.push("Netease scrape failed or empty. Injecting Archive.org Backups.");
      newSets = [...FALLBACK_DJ_SETS];
  }

  // --- SAVE TO KV ---
  if (newSets.length > 0) {
      try {
          const currentDataStr = await env.DB.get('app_data');
          let currentData = currentDataStr ? JSON.parse(currentDataStr) : {};

          let existingSets = currentData.djSets || [];
          const existingMap = new Map(existingSets.map(s => [s.id, s]));
          
          for (const s of newSets) {
              existingMap.set(s.id, s);
          }
          
          let merged = Array.from(existingMap.values());
          if (merged.length > 200) merged = merged.slice(0, 200);

          currentData.djSets = merged;
          await env.DB.put('app_data', JSON.stringify(currentData));
          
          return { success: true, count: newSets.length, logs: log };
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
            
            // Strictly enforce Netease headers
            if (strategy === 'netease' || targetUrl.includes('163.com') || targetUrl.includes('126.net')) {
                referer = 'https://music.163.com/';
                // Netease sometimes checks for specific cookies or UA
                userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            } else if (strategy === 'pixabay') {
                referer = 'https://pixabay.com/';
            } else if (strategy === 'djuu') {
                referer = 'https://www.djuu.com/';
            }

            const proxyHeaders = new Headers();
            proxyHeaders.set('User-Agent', userAgent);
            proxyHeaders.set('Referer', referer);
            
            const range = request.headers.get('Range');
            if (range) proxyHeaders.set('Range', range);

            const response = await fetch(targetUrl, {
                method: request.method,
                headers: proxyHeaders
            });

            // Reconstruct headers for CORS
            const newHeaders = new Headers(response.headers);
            Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));
            
            // Force content type if missing for MP3
            if ((targetUrl.endsWith('.mp3') || targetUrl.includes('.mp3')) && !newHeaders.has('Content-Type')) {
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

    // --- ADMIN LINK VALIDATOR (NEW) ---
    if (url.pathname === '/api/admin/validate' && request.method === 'POST') {
       if (!isAuthorized(request)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       }
       try {
           const { targetUrl } = await request.json();
           if (!targetUrl) return new Response(JSON.stringify({ valid: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

           let urlToCheck = targetUrl;
           if (targetUrl.startsWith('/api/proxy') || targetUrl.startsWith('/')) {
               const u = new URL(request.url);
               urlToCheck = u.origin + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
           }

           let valid = false;
           let status = 0;
           
           try {
              // Try HEAD first
              const res = await fetch(urlToCheck, { method: 'HEAD', headers: { 'User-Agent': 'Cloudflare Worker' } });
              status = res.status;
              if (res.ok) valid = true;
              else {
                   // Fallback to GET with Range
                   const resGet = await fetch(urlToCheck, { method: 'GET', headers: { 'Range': 'bytes=0-100', 'User-Agent': 'Cloudflare Worker' } });
                   status = resGet.status;
                   valid = resGet.ok;
              }
           } catch (e) {
               valid = false;
               status = 500;
           }

           return new Response(JSON.stringify({ valid, status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

       } catch (e) {
           return new Response(JSON.stringify({ error: e.message, valid: false }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    // --- AUTH ---
    if (url.pathname === '/api/auth' && request.method === 'POST') {
      try {
        const body = await request.json();
        const valid = !env.ADMIN_SECRET || body.key === env.ADMIN_SECRET;
        return new Response(JSON.stringify({ valid }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
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

    // --- R2 STORAGE API ---
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!env.BUCKET) return new Response(JSON.stringify({ error: "R2 Not Configured" }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const filename = url.searchParams.get('filename') || `file-${Date.now()}`;
      await env.BUCKET.put(filename, request.body);
      const publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}` : `/api/file/${filename}`;
      return new Response(JSON.stringify({ url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
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
    
    if (url.pathname === '/api/storage/delete' && request.method === 'DELETE') {
       if (!isAuthorized(request)) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
       const key = url.searchParams.get('key');
       if (!env.BUCKET) return new Response("R2 Not Configured", { status: 503 });
       await env.BUCKET.delete(key);
       return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
            return new Response(object.body, { headers, status: object.range ? 206 : 200 });
        } catch(e) { return new Response("Stream Error", { status: 500 }); }
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
