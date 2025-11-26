
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      // First, try to fetch the requested asset (e.g., main.js, image.png)
      // The ASSETS binding allows us to fetch static files from the 'dist' directory.
      let response = await env.ASSETS.fetch(request);
      
      // If the asset is found (status 200) or it's a 304 (Not Modified), return it.
      if (response.status >= 200 && response.status < 400) {
        return response;
      }

      // If it's a 404 and it's a navigation request (not an API call or image), serve index.html
      // This enables client-side routing in React (SPA behavior).
      if (response.status === 404 && !url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }

      return response;
    } catch (e) {
      // Fallback
      return new Response("Internal Error", { status: 500 });
    }
  },
};
