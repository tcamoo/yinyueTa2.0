
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

#### C. 设置控制台密码 (安全锁)
为了防止他人进入系统控制台或通过 API 修改数据：
1.  找到 **Environment Variables** (不是绑定)。
2.  点击 **Add Variable**。
3.  **Variable name**: 输入 `ADMIN_SECRET`。
4.  **Value**: 输入您的密码（例如 `my-secure-password-2024`）。
5.  点击 **Encrypt** (推荐)。
6.  点击 **Save and Deploy**。
7.  访问网站控制台时，输入此密码即可解锁。

### 3. 在网站上连接

1.  打开您的网站。
2.  进入 **System Console (系统控制台)** 页面 (点击左侧边栏底部的 Grid 图标)。
3.  您将看到“SYSTEM LOCKED”界面，输入您设置的 `ADMIN_SECRET` 解锁。
4.  解锁后，所有上传和保存操作将自动携带密钥。

## 🎨 网站特性

* **R2 文件直传**: 支持 MP3、图片、视频直接上传到 Cloudflare R2。
* **KV 实时同步**: 歌单、文章、主题设置自动同步。
* **Admin 安全锁**: 前端控制台锁屏 + 后端 API 鉴权。
* **沉浸式 UI**: 包含动态歌词、3D 视觉效果和全屏 MV 模式。
