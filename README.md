
# 音悦台 | YINYUETAI (Cloudflare Edition)

高端、沉浸式音乐流媒体平台。前端采用 React + Vite，后端采用 Cloudflare Workers + KV + R2。

## ☁️ 部署与配置指南

本项目支持直接部署到 Cloudflare，并通过 Cloudflare Dashboard (后台) 进行资源绑定，无需修改代码中的 ID。

### 1. 部署项目

首先将项目部署到 Cloudflare Workers (作为 Assets Worker):

```bash
npm run build
npx wrangler deploy
```

### 2. 在 Cloudflare 后台绑定资源 (关键步骤)

部署完成后，为了启用“永久保存”和“文件上传”，您需要在后台绑定 KV 和 R2。

1.  登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2.  进入 **Workers & Pages** -> 选择您的项目 `yinyuetai`。
3.  点击 **Settings (设置)** -> **Variables (变量)**。

#### A. 绑定数据库 (KV)
1.  找到 **KV Namespace Bindings**。
2.  点击 **Add Binding**。
3.  **Variable name**: 输入 `DB` (必须完全一致)。
4.  **KV Namespace**: 选择现有的 KV 空间（如果没有，请先去 KV 菜单创建一个名为 `yinyuetai-data` 的空间）。
5.  点击 **Save and Deploy**。

#### B. 绑定存储桶 (R2)
1.  找到 **R2 Bucket Bindings**。
2.  点击 **Add Binding**。
3.  **Variable name**: 输入 `BUCKET` (必须完全一致)。
4.  **R2 Bucket**: 选择现有的 R2 存储桶（如果没有，请先去 R2 菜单创建一个）。
5.  点击 **Save and Deploy**。

#### C. 设置管理员密钥 (可选，增强安全)
为了防止他人通过 API 修改您的数据，建议设置一个密钥：
1.  找到 **Environment Variables**。
2.  点击 **Add Variable**。
3.  **Variable name**: 输入 `ADMIN_SECRET`。
4.  **Value**: 输入一个复杂的密码（例如 `my-super-secret-key-2024`）。
5.  点击 **Save and Deploy**。

### 3. 在网站上连接

1.  打开您的网站。
2.  进入 **System Console (系统控制台)** 页面 (点击左侧边栏底部的 Grid 图标)。
3.  点击顶部状态栏的 **CLOUD STATUS** 按钮（如果是红色或黄色）。
4.  在弹出的窗口中输入您刚才设置的 `ADMIN_SECRET` 并保存。
5.  现在您可以正常上传文件和保存数据了！

## 🎨 网站特性

* **R2 文件直传**: 支持 MP3、图片、视频直接上传到 Cloudflare R2。
* **KV 实时同步**: 歌单、文章、主题设置自动同步。
* **Admin 安全验证**: 通过 Header 验证写操作权限。
* **沉浸式 UI**: 包含动态歌词、3D 视觉效果和全屏 MV 模式。
