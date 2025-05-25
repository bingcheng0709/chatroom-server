#!/bin/bash

# 聊天室完整部署腳本
echo "🚀 開始聊天室完整部署流程..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 部署目錄
DEPLOY_DIR="/Users/bingcheng/Desktop/AI校園心理健康互助平台web/chatroom-deploy"

echo -e "${BLUE}📋 部署檢查清單：${NC}"
echo "1. ✅ GitHub 存儲庫已更新"
echo "2. ⏳ Railway 部署 (手動操作需要)"
echo "3. ⏳ 前端配置更新"
echo "4. ⏳ 測試部署"
echo ""

echo -e "${YELLOW}📝 接下來請按照以下步驟操作：${NC}"
echo ""

echo -e "${BLUE}🌐 步驟 1: Railway 部署${NC}"
echo "1. 前往 Railway 官網: https://railway.app"
echo "2. 登錄您的 GitHub 帳戶"
echo "3. 點擊 'New Project' -> 'Deploy from GitHub repo'"
echo "4. 選擇 'bingcheng0709/chatroom-server' 存儲庫"
echo "5. Railway 會自動檢測配置並開始部署"
echo "6. 部署完成後，複製分配的 URL (類似: https://xxx.railway.app)"
echo ""

echo -e "${BLUE}🔧 步驟 2: 自動更新前端配置${NC}"
echo "部署完成後，請運行："
echo "cd \"$DEPLOY_DIR\" && ./update-frontend-config.sh [您的Railway URL]"
echo ""

echo -e "${BLUE}📊 步驟 3: 檢查部署狀態${NC}"
echo "運行檢查腳本："
echo "cd \"$DEPLOY_DIR\" && ./check-deployment.sh [您的Railway URL]"
echo ""

echo -e "${GREEN}📂 當前 GitHub 存儲庫狀態：${NC}"
cd "$DEPLOY_DIR"
echo "存儲庫: https://github.com/bingcheng0709/chatroom-server.git"
echo "最新提交: $(git log --oneline -1)"
echo ""

echo -e "${YELLOW}💡 提示：${NC}"
echo "- Railway 免費方案每月有 $5 的使用額度"
echo "- 部署通常需要 2-5 分鐘"
echo "- 如果部署失敗，可以查看 Railway 的部署日誌"
echo "- 備用選項：可以使用 Render.com (配置文件已準備好)"
echo ""

echo -e "${GREEN}✨ 準備就緒！請前往 Railway 開始部署。${NC}"
