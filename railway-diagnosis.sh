#!/bin/bash

# Railway 部署診斷腳本
echo "🔍 Railway 部署診斷報告"
echo "========================"
echo ""

SERVER_URL="https://dyu-chatroom-production.up.railway.app"

echo "📅 檢查時間: $(date)"
echo "🌐 服務器 URL: $SERVER_URL"
echo ""

# 檢查 1: 基本連接
echo "🔌 檢查 1: 基本 HTTP 連接"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVER_URL" 2>/dev/null || echo "TIMEOUT")
echo "   HTTP 狀態碼: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "502" ]; then
    echo "   ❌ 502 Bad Gateway - 應用程序無法啟動"
elif [ "$HTTP_STATUS" = "503" ]; then
    echo "   ❌ 503 Service Unavailable - 服務暫時不可用"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ 200 OK - 服務正常"
else
    echo "   ⚠️  狀態碼: $HTTP_STATUS"
fi

# 檢查 2: 健康檢查端點
echo ""
echo "💚 檢查 2: 健康檢查端點"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVER_URL/health" 2>/dev/null || echo "TIMEOUT")
echo "   健康檢查狀態: $HEALTH_STATUS"

# 檢查 3: 測試端點
echo ""
echo "🧪 檢查 3: 測試端點"
TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVER_URL/test" 2>/dev/null || echo "TIMEOUT")
echo "   測試端點狀態: $TEST_STATUS"

# 檢查 4: 響應時間
echo ""
echo "⏱️  檢查 4: 響應時間"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$SERVER_URL" 2>/dev/null || echo "TIMEOUT")
echo "   響應時間: ${RESPONSE_TIME}s"

# 檢查 5: DNS 解析
echo ""
echo "🌍 檢查 5: DNS 解析"
nslookup dyu-chatroom-production.up.railway.app | grep "Address:" | tail -1

echo ""
echo "📊 診斷總結:"
if [ "$HTTP_STATUS" = "502" ]; then
    echo "❌ 主要問題: 應用程序無法啟動 (502 錯誤)"
    echo ""
    echo "🔧 可能的解決方案:"
    echo "1. 檢查 Railway 構建日誌"
    echo "2. 驗證 package.json 中的 start 腳本"
    echo "3. 檢查環境變量配置"
    echo "4. 驗證端口綁定 (使用 process.env.PORT)"
    echo "5. 檢查依賴項是否正確安裝"
    echo ""
    echo "🚀 建議操作:"
    echo "- 登錄 Railway Dashboard 檢查構建和部署日誌"
    echo "- 驗證 nixpacks.toml 配置"
    echo "- 嘗試重新部署"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 服務器運行正常！"
else
    echo "⚠️  服務器狀態異常，需要進一步調查"
fi

echo ""
echo "🔗 有用的連結:"
echo "   Railway Dashboard: https://railway.app/dashboard"
echo "   GitHub 倉庫: https://github.com/bingcheng0709/chatroom-server"
