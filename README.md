# 聊天室遠端部署說明

## 🚀 部署步驟

### 1. 使用 Railway 部署 (推薦)

1. 前往 https://railway.app 註冊帳號
2. 點擊 "New Project" → "Deploy from GitHub repo"
3. 連接您的 GitHub 帳號並選擇包含此資料夾內容的倉庫
4. Railway 會自動偵測到 `railway.toml` 設定檔
5. 部署完成後，您會獲得一個 URL，例如: `https://your-app-name.up.railway.app`

### 2. 使用 Render 部署

1. 前往 https://render.com 註冊帳號
2. 點擊 "New" → "Web Service"
3. 連接 GitHub 倉庫
4. 設定：
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `NODE_ENV=production`

### 3. 使用 Heroku 部署

1. 安裝 Heroku CLI
2. 執行以下命令：
```bash
heroku create your-chatroom-app
git add .
git commit -m "Deploy chatroom"
git push heroku main
```

### 4. 使用 Docker 部署

```bash
docker build -t chatroom-server .
docker run -p 3001:3001 -e NODE_ENV=production chatroom-server
```

## 📝 部署後設定

1. 獲取部署後的服務器 URL
2. 修改前端配置檔 `js/chatroom-config.js`
3. 將 `production.serverUrl` 改為您的實際服務器地址
4. 將前端部署到 Netlify 或 Vercel

## 🔧 環境變數

- `NODE_ENV`: production
- `PORT`: 自動設定 (通常由平台提供)

## 📞 支援

如有問題，請檢查：
1. 服務器日誌
2. 網路連接
3. CORS 設定
