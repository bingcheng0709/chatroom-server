#!/bin/bash

# 聊天室服務器部署腳本
echo "🚀 開始部署聊天室服務器..."

# 檢查是否提供了 GitHub 儲存庫 URL
if [ -z "$1" ]; then
    echo "❌ 請提供 GitHub 儲存庫 URL"
    echo "用法: ./deploy.sh https://github.com/username/repo-name.git"
    exit 1
fi

REPO_URL=$1

echo "📦 設置 Git 遠端儲存庫..."
git remote add origin $REPO_URL

echo "🔄 推送代碼到 GitHub..."
git push -u origin main

echo "✅ 代碼已推送到 GitHub!"
echo ""
echo "🎯 接下來的步驟:"
echo "1. 前往 https://railway.app"
echo "2. 點擊 'New Project' → 'Deploy from GitHub repo'"
echo "3. 選擇您剛剛創建的儲存庫"
echo "4. Railway 會自動檢測 railway.toml 並開始部署"
echo "5. 部署完成後，複製提供的 URL"
echo "6. 更新前端配置文件中的 serverUrl"
echo ""
echo "🔗 有用的連結:"
echo "- Railway Dashboard: https://railway.app/dashboard"
echo "- GitHub Repository: $REPO_URL"
