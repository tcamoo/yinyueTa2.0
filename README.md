
# 音悦台 | YINYUETAI (Cloudflare Edition)

高端、沉浸式音乐流媒体平台。前端采用 React + Vite，后端采用 Cloudflare Workers + KV + R2。

## ☁️ 云端配置指南 (必读)

您的项目目前已成功部署，但**尚未连接到数据库**。为了实现“永久保存”和“文件上传”功能，请务必执行以下步骤。

### 第一步：创建 KV 和 R2 资源

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 进入 **Workers & Pages** -> **KV**，点击 "Create a Namespace"，命名为 `yinyuetai-data`。复制生成的 `ID`。
3. 进入 **R2** 菜单，点击 "Create Bucket"，命名为 `yinyuetai-media`。

### 第二步：更新 wrangler.json

打开您项目根目录下的 `wrangler.json`，将空的绑定配置替换为实际的 ID：

```json
  "kv_namespaces": [
    {
      "binding": "DB",
      "id": "粘贴您的KV_ID",
      "preview_id": "粘贴您的KV_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "yinyuetai-media",
      "preview_bucket_name": "yinyuetai-media"
    }
  ],
```

### 第三步：重新部署

在修改完 `wrangler.json` 后，重新运行部署命令或推送到 GitHub，Cloudflare 将自动应用新的绑定。

---

## 🛠 功能状态检查

在网站的“系统控制台” (Library) 页面，顶部会显示云端连接状态：
* **🟢 CLOUD ACTIVE**: 配置正确，数据实时同步。
* **🟡 NO DATABASE**: 未配置 KV/R2，数据仅保存在本地内存，刷新即逝。

## 🎨 网站特性

* **R2 文件直传**: 支持 MP3、图片、视频直接上传到 Cloudflare R2。
* **KV 实时同步**: 歌单、文章、主题设置自动同步。
* **沉浸式 UI**: 包含动态歌词、3D 视觉效果和全屏 MV 模式。
