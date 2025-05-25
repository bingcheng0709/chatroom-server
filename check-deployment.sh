#!/bin/bash

# Railway 部署狀態檢查腳本
echo "🔍 檢查 Railway 部署狀態..."

if [ -z "$1" ]; then
    echo "❌ 請提供 Railway 部署 URL"
    echo "用法: ./check-deployment.sh https://your-app.railway.app"
    exit 1
fi

RAILWAY_URL=$1

echo "📡 檢查服務器健康狀態..."
curl -s "${RAILWAY_URL}/health" | jq . || curl -s "${RAILWAY_URL}/health"

echo ""
echo "🔗 檢查 API 端點..."
curl -s "${RAILWAY_URL}/api/health" | jq . || curl -s "${RAILWAY_URL}/api/health"

echo ""
echo "📊 檢查 Socket.IO 端點..."
curl -s "${RAILWAY_URL}/socket.io/" -I | head -n 1

echo ""
echo "✅ 部署檢查完成！"
echo "如果看到 'status: ok' 表示服務器正常運行"
