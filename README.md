
# 音悦台 | YINYUETAI (Cloudflare Edition)

高端、沉浸式音乐流媒体平台。前端采用 React + Vite，后端采用 Cloudflare Workers + KV + R2。

## ☁️ 云端配置指南 (必读)

为了实现数据的永久保存和文件上传功能，你需要配置 Cloudflare KV 和 R2。

### 1. 创建 KV 命名空间 (数据库)

KV 用于存储歌曲列表、文章元数据和主题设置。

1. 登录 Cloudflare Dashboard。
2. 进入 **Workers & Pages** -> **KV**.
3. 点击 **Create a Namespace**.
4. 命名为 `yinyuetai-data`.
5. 获取 `ID`。

### 2. 创建 R2 存储桶 (文件存储)

R2 用于存储上传的 MP3、图片和视频文件。

1. 进入 **R2** 菜单。
2. 点击 **Create Bucket**.
3. 命名为 `yinyuetai-media`.
4. (可选) 在 Bucket 设置中配置 **Custom Domain** (例如 `media.yourdomain.com`) 以获得更快的访问速度。

### 3. 配置项目

修改根目录下的 `wrangler.json` 文件：

```json
  "kv_namespaces": [
    {
      "binding": "DB",
      "id": "替换为你的KV_ID",
      "preview_id": "替换为你的KV_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "yinyuetai-media",
      "preview_bucket_name": "yinyuetai-media"
    }
  ],
  "vars": {
    "R2_PUBLIC_URL": "" // 如果配置了自定义域名，填入 https://media.yourdomain.com，否则留空
  }
```

### 4. 部署

```bash
npx wrangler deploy
```

---

## 🛠 功能特性

* **R2 文件直传**: 在控制台上传图片/音频时，文件会自动上传到 Cloudflare R2，并返回永久链接。
* **KV 实时同步**: 添加歌曲、修改文章或更换主题后，数据会自动同步到 Cloudflare KV，刷新页面不会丢失。
* **Admin 控制台**: 访问左侧边栏底部的 "系统控制台" 进行内容管理。

## ⚠️ 注意事项

* 如果未配置 `R2_PUBLIC_URL`，系统将使用 Worker 作为文件代理 (`/api/file/...`)，这会消耗 Worker 的 CPU 时间。建议生产环境配置 R2 自定义域名。
* 首次部署后，数据库为空，应用将加载默认的演示数据。当你第一次在控制台点击 "同步到云端" 或进行编辑保存操作后，演示数据将被你的云端数据覆盖。
