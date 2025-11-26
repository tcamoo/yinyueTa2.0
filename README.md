
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



# 音悦台 | YINYUETAI - Cloudflare 部署终极指南

这份文档详细记录了将本项目部署到 Cloudflare 的完整流程、架构逻辑及故障排除方案。请按照此步骤操作，确保一次部署成功。

---

## 1. 核心架构与代码结构

本项目采用 **"前后端分离但同构部署"** 的架构。前端是静态资源，后端是 Serverless 函数，它们打包在一起通过 Cloudflare Worker 发布。

*   **前端 (React + Vite)**: 
    *   源码位于 `src/` (本项目根目录即源码)。
    *   通过 `npm run build` 编译，生成 `dist/` 文件夹。这是用户在浏览器中看到的界面。
*   **后端 (Cloudflare Worker)**:
    *   核心逻辑在 `worker.js`。
    *   它充当网关：拦截 `/api/` 请求处理数据（读写 KV/R2），其他请求则返回 `dist/` 中的静态文件（HTML/JS/CSS）。
*   **配置文件 (`wrangler.json`)**:
    *   这是 Cloudflare 的指挥棒。它告诉 Cloudflare：入口文件是 `worker.js`，静态资源在 `dist/` 目录。

---

## 2. 部署前准备 (Pre-flight Check)

在开始之前，请确保环境就绪：

1.  **Node.js**: 确保安装了 Node.js (v18+)。
2.  **Wrangler CLI**: Cloudflare 的命令行工具。
    ```bash
    npm install -g wrangler
    ```
3.  **账号登录**:
    ```bash
    wrangler login
    # 浏览器会弹出，授权即可
    ```

---

## 3. 标准部署流程 (Standard Procedure)

### 第一步：本地构建 (Build)

这步是将 React 代码转化为浏览器能运行的静态文件。

```bash
# 1. 安装依赖
npm install

# 2. 编译项目 (这一步会生成 dist 文件夹)
npm run build
```

> **⚠️ 注意**: 每次修改前端代码（如 React 组件、样式）后，**必须**重新执行 `npm run build`，否则部署上去的还是旧界面。

### 第二步：上传代码 (Deploy)

将代码和 Worker 逻辑推送到 Cloudflare。

```bash
npx wrangler deploy
```

如果不报错，您会看到终端输出一个 URL (例如 `https://yinyuetai.<your-subdomain>.workers.dev`)。此时访问网站可能会报错（如 500 Error），因为**后台资源还没绑定**。

### 第三步：后台资源绑定 (Dashboard Config)

这是**最关键**的一步。代码部署上去了，但 Worker 还不知道去哪里存数据。

1.  登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2.  进入 **Workers & Pages** -> 点击项目名 `yinyuetai-neon-pulse`。
3.  点击顶部的 **Settings (设置)** -> **Variables (变量)**。

#### A. 绑定数据库 (KV Namespace)
KV 用于存储歌单、文章、页面配置等元数据。
1.  找到 **KV Namespace Bindings** 区域。
2.  点击 **Add Binding**。
3.  **Variable name**: 输入 `DB` (**必须大写，完全一致**)。
4.  **KV Namespace**: 选择一个空间。如果没有，点击 "Create new KV namespace" 创建一个（例如命名为 `yinyuetai-data`）。
5.  点击 **Save and Deploy**。

#### B. 绑定存储桶 (R2 Bucket)
R2 用于存储 MP3、图片、视频文件。
1.  找到 **R2 Bucket Bindings** 区域。
2.  点击 **Add Binding**。
3.  **Variable name**: 输入 `BUCKET` (**必须大写，完全一致**)。
4.  **R2 Bucket**: 选择一个存储桶。如果没有，需先去 R2 菜单创建一个。
5.  点击 **Save and Deploy**。

#### C. 设置管理员密码 (Environment Variables)
这是为了保护控制台不被外人修改。
1.  找到 **Environment Variables** 区域。
2.  点击 **Add Variable**。
3.  **Variable name**: 输入 `ADMIN_SECRET`。
4.  **Value**: 输入您的密码（例如 `admin888`）。
5.  点击 **Encrypt** (加密保存)。
6.  点击 **Save and Deploy**。

---

## 4. R2 跨域配置 (CORS) - 必做！

如果不做这一步，上传文件或播放音乐时可能会报 `CORS Error` 或播放失败。

1.  在 Cloudflare Dashboard 左侧菜单点击 **R2**。
2.  点击您绑定的那个存储桶。
3.  点击 **Settings (设置)** 标签页。
4.  向下滚动找到 **CORS Policy (跨域策略)**。
5.  点击 **Add/Edit CORS Policy**，粘贴以下 JSON：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
6.  点击 **Save**。

---

## 5. 故障排除 (Troubleshooting)

| 现象 | 可能原因 | 解决方案 |
| :--- | :--- | :--- |
| **500 Internal Server Error** | 也是最常见的错误。通常是因为 KV 或 R2 没有在后台绑定。 | 检查 Settings -> Variables。变量名必须是 `DB` 和 `BUCKET`。绑定后记得点 "Save and Deploy"。 |
| **页面一片空白 / Loading 不消失** | 可能是 `dist` 目录没生成或损坏。 | 重新运行 `npm run build` 然后 `npx wrangler deploy`。 |
| **上传文件失败 / Error 401** | 未通过管理员验证。 | 1. 确保后台设置了 `ADMIN_SECRET`。<br>2. 确保在网页控制台输入了相同的密码并解锁。 |
| **播放音乐没声音 / 跨域错误** | R2 存储桶没配置 CORS。 | 按照本文第 4 节配置 CORS 策略。 |
| **控制台无法保存数据** | 密码错误或 KV 未绑定。 | 重新登录网页控制台；检查 KV 绑定状态。 |
| **修改了代码不生效** | 忘记 Build 了。 | 请务必执行 `npm run build` 再 deploy。 |

---

## 6. 常用命令清单

```bash
# 本地开发 (只启动前端，不带 Cloudflare 后端逻辑，通常用于调 UI)
npm run dev

# 本地预览 (模拟 Cloudflare 环境，强烈推荐用于测试 API)
npx wrangler dev

# 正式发布
npm run build && npx wrangler deploy
```

