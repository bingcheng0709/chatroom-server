#!/bin/bash

# 前端配置更新腳本
echo "🔧 更新前端聊天室配置..."

if [ -z "$1" ]; then
    echo "❌ 請提供部署後的服務器 URL"
    echo "用法: ./update-frontend-config.sh https://your-app.railway.app"
    exit 1
fi

SERVER_URL=$1
CONFIG_FILE="../js/chatroom-config.js"

# 檢查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 找不到配置文件: $CONFIG_FILE"
    exit 1
fi

echo "📝 備份原配置文件..."
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

echo "🔄 更新服務器 URL 為: $SERVER_URL"
sed -i.tmp "s|serverUrl: 'https://your-chatroom-server.railway.app'|serverUrl: '$SERVER_URL'|g" "$CONFIG_FILE"
rm "$CONFIG_FILE.tmp"

echo "✅ 前端配置已更新!"
echo ""
echo "📋 接下來您可以:"
echo "1. 將前端文件部署到 Netlify 或 Vercel"
echo "2. 或者直接在本地測試連接到遠端服務器"
echo ""
echo "🔗 配置文件位置: $CONFIG_FILE"
echo "💾 備份文件位置: $CONFIG_FILE.backup"
