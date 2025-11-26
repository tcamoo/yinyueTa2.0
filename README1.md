# Cloudflare Workers 部署指南 (React + Vite)

本指南总结了将 React 单页应用 (SPA) 部署到 Cloudflare Workers 的必要条件和步骤。

## 核心原理

Cloudflare Workers 部署静态网站时，默认是 "Assets Only" 模式。但对于 React SPA 应用，我们需要处理前端路由（例如用户直接访问 `/charts` 时，服务器需要返回 `index.html` 而不是 404）。

因此，我们需要：
1. **静态资源目录 (`dist`)**：存放构建后的文件。
2. **Worker 脚本 (`worker.js`)**：拦截请求，如果找不到文件，则返回 `index.html`。
3. **配置文件 (`wrangler.json`)**：将两者绑定在一起。

---

## 1. 必要文件配置

### A. `wrangler.json` (核心配置)
在项目根目录创建此文件。这是告诉 Cloudflare 如何运行你的应用。

```json
{
  "name": "yinyuetai-neon-pulse",
  "main": "worker.js", 
  "compatibility_date": "2024-11-26",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  }
}
```
* **注意**：必须指定 `"main": "worker.js"` 和 `"binding": "ASSETS"`，否则无法在 Worker 中访问静态资源。

### B. `worker.js` (SPA 路由处理)
在项目根目录创建此文件。它处理 "页面刷新 404" 的问题。

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      // 1. 尝试从 ASSETS 绑定中获取静态文件 (js, css, png, etc.)
      let response = await env.ASSETS.fetch(request);
      
      // 2. 如果找到了文件 (200) 或者缓存 (304)，直接返回
      if (response.status >= 200 && response.status < 400) {
        return response;
      }

      // 3. 关键步骤：如果是 404 且不是 API 请求或文件扩展名请求，
      // 则返回 index.html (SPA 路由回退)
      if (response.status === 404 && !url.pathname.startsWith('/api/') && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }

      return response;
    } catch (e) {
      return new Response("Internal Error", { status: 500 });
    }
  },
};
```

---

## 2. 部署步骤

### 第一步：构建项目
确保 Vite 构建成功，生成 `dist` 目录。

```bash
npm run build
# 或者
tsc && vite build
```

### 第二步：部署到 Cloudflare
使用 Wrangler CLI 进行部署。

```bash
npx wrangler deploy
```

---

## 3. 常见问题排查

**错误：`Cannot use assets with a binding in an assets-only Worker`**
* **原因**：你在 `wrangler.json` 中定义了 `assets.binding`，但是没有提供 `main` (Worker 脚本)。
* **解决**：确保 `wrangler.json` 中包含 `"main": "worker.js"`，并且项目根目录下有这个 js 文件。

**错误：页面刷新后 404 Not Found**
* **原因**：缺少 SPA 路由回退机制。
* **解决**：检查 `worker.js` 中的逻辑，确保当资源未找到时，会 serve `/index.html`。

**错误：样式丢失或 MIME 类型错误**
* **原因**：`index.html` 中可能包含不兼容的 `importmap` 或绝对路径错误。
* **解决**：确保构建后的 `index.html` 引用路径正确（Vite 默认处理得很好），并移除不仅要的 `importmap` 脚本块。
