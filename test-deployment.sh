#!/bin/bash

# 聊天室部署測試腳本
echo "🧪 聊天室部署測試腳本"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -eq 0 ]; then
    echo -e "${YELLOW}使用方法: $0 <SERVER_URL>${NC}"
    echo "例如: $0 https://your-app.railway.app"
    echo ""
    echo -e "${BLUE}💡 這個腳本將測試：${NC}"
    echo "  ✓ 服務器連接性"
    echo "  ✓ Socket.IO 端點"
    echo "  ✓ 前端配置"
    echo ""
    exit 1
fi

SERVER_URL=$1
echo -e "${BLUE}🌐 測試服務器: $SERVER_URL${NC}"
echo ""

# 測試 1: 基本連接測試
echo -e "${BLUE}📡 測試 1: 基本 HTTP 連接${NC}"
if curl -s --max-time 10 "$SERVER_URL" > /dev/null; then
    echo -e "${GREEN}✅ HTTP 連接正常${NC}"
else
    echo -e "${RED}❌ HTTP 連接失敗${NC}"
    echo -e "${YELLOW}💡 請檢查 URL 是否正確，服務器是否正在運行${NC}"
fi

# 測試 2: Socket.IO 端點測試
echo ""
echo -e "${BLUE}🔌 測試 2: Socket.IO 端點${NC}"
SOCKETIO_URL="$SERVER_URL/socket.io/"
if curl -s --max-time 10 "$SOCKETIO_URL" > /dev/null; then
    echo -e "${GREEN}✅ Socket.IO 端點可訪問${NC}"
else
    echo -e "${RED}❌ Socket.IO 端點無法訪問${NC}"
fi

# 測試 3: 前端配置檢查
echo ""
echo -e "${BLUE}⚙️  測試 3: 前端配置檢查${NC}"
CONFIG_FILE="../js/chatroom-config.js"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "$SERVER_URL" "$CONFIG_FILE"; then
        echo -e "${GREEN}✅ 前端配置已正確更新${NC}"
    else
        echo -e "${YELLOW}⚠️  前端配置可能需要更新${NC}"
        echo -e "${BLUE}🔧 運行以下命令更新配置:${NC}"
        echo "   ./update-frontend-config.sh $SERVER_URL"
    fi
else
    echo -e "${RED}❌ 找不到前端配置文件${NC}"
fi

# 測試 4: 健康檢查
echo ""
echo -e "${BLUE}💚 測試 4: 服務器健康檢查${NC}"
HEALTH_URL="$SERVER_URL/health"
if curl -s --max-time 10 "$HEALTH_URL" | grep -q "OK\|healthy\|alive"; then
    echo -e "${GREEN}✅ 服務器健康檢查通過${NC}"
else
    echo -e "${YELLOW}⚠️  健康檢查端點可能不存在（這是正常的）${NC}"
fi

echo ""
echo -e "${BLUE}📊 測試總結:${NC}"
echo -e "${GREEN}如果上述測試都通過，您的聊天室應該已經成功部署！${NC}"
echo ""
echo -e "${YELLOW}🎯 下一步:${NC}"
echo "1. 更新前端配置: ./update-frontend-config.sh $SERVER_URL"
echo "2. 在瀏覽器中打開 community.html 測試聊天室"
echo "3. 可選：將前端部署到 Netlify 或 Vercel"
echo ""
echo -e "${BLUE}🔗 有用的連結:${NC}"
echo "📝 GitHub 存儲庫: https://github.com/bingcheng0709/chatroom-server"
echo "🌐 部署的服務器: $SERVER_URL"
