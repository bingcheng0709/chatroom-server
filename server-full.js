const express = require('express');
const http = require('http');

console.log('🚀 開始啟動完整聊天室服務器...');
console.log('📦 Node.js 版本:', process.version);
console.log('🌐 環境變量 NODE_ENV:', process.env.NODE_ENV);
console.log('🔌 環境變量 PORT:', process.env.PORT);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

console.log('✅ Express 應用已創建');
console.log(`🎯 將使用端口: ${PORT}`);

// 中間件配置
app.use(express.json());
app.use(express.static('public')); // 如果有靜態文件

// CORS 設置（針對跨域請求）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

console.log('✅ 中間件已配置');

// 簡單的聊天室數據存儲（在記憶體中）
const chatRooms = {
    general: {
        id: 'general',
        name: '一般討論',
        description: '歡迎來到一般討論區',
        messages: [],
        users: []
    },
    support: {
        id: 'support',
        name: '心理支援',
        description: '提供心理健康支援與分享',
        messages: [],
        users: []
    },
    study: {
        id: 'study',
        name: '學習互助',
        description: '學習問題討論與互助',
        messages: [],
        users: []
    }
};

// API 路由
app.get('/', (req, res) => {
    console.log('收到根路徑請求');
    res.json({ 
        message: '大葉大學聊天室服務器運行中 - 完整版本',
        status: 'ok',
        version: '2.0.0',
        features: ['HTTP API', 'Chat Rooms', 'Message Storage'],
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    console.log('收到健康檢查請求');
    res.json({ 
        status: 'ok', 
        message: '服務器健康',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        rooms: Object.keys(chatRooms).length,
        totalMessages: Object.values(chatRooms).reduce((sum, room) => sum + room.messages.length, 0)
    });
});

// 獲取所有聊天室
app.get('/api/rooms', (req, res) => {
    console.log('獲取聊天室列表');
    const roomList = Object.values(chatRooms).map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        messageCount: room.messages.length,
        userCount: room.users.length
    }));
    res.json(roomList);
});

// 獲取特定聊天室的訊息
app.get('/api/rooms/:roomId/messages', (req, res) => {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!chatRooms[roomId]) {
        return res.status(404).json({ error: '聊天室不存在' });
    }
    
    const messages = chatRooms[roomId].messages.slice(-limit);
    res.json(messages);
});

// 發送訊息到聊天室
app.post('/api/rooms/:roomId/messages', (req, res) => {
    const { roomId } = req.params;
    const { content, username, userId } = req.body;
    
    if (!chatRooms[roomId]) {
        return res.status(404).json({ error: '聊天室不存在' });
    }
    
    if (!content || !username) {
        return res.status(400).json({ error: '訊息內容和用戶名稱為必填' });
    }
    
    const message = {
        id: Date.now().toString(),
        content,
        username,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        roomId
    };
    
    chatRooms[roomId].messages.push(message);
    
    // 保持最多 1000 條訊息
    if (chatRooms[roomId].messages.length > 1000) {
        chatRooms[roomId].messages = chatRooms[roomId].messages.slice(-1000);
    }
    
    console.log(`新訊息到 ${roomId}:`, message);
    res.json(message);
});

// 加入聊天室
app.post('/api/rooms/:roomId/join', (req, res) => {
    const { roomId } = req.params;
    const { username, userId } = req.body;
    
    if (!chatRooms[roomId]) {
        return res.status(404).json({ error: '聊天室不存在' });
    }
    
    if (!username) {
        return res.status(400).json({ error: '用戶名稱為必填' });
    }
    
    const user = {
        id: userId || Date.now().toString(),
        username,
        joinedAt: new Date().toISOString()
    };
    
    // 移除已存在的用戶（如果有的話）
    chatRooms[roomId].users = chatRooms[roomId].users.filter(u => u.id !== user.id);
    chatRooms[roomId].users.push(user);
    
    console.log(`用戶 ${username} 加入房間 ${roomId}`);
    res.json({ success: true, user, room: chatRooms[roomId].name });
});

// 離開聊天室
app.post('/api/rooms/:roomId/leave', (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!chatRooms[roomId]) {
        return res.status(404).json({ error: '聊天室不存在' });
    }
    
    chatRooms[roomId].users = chatRooms[roomId].users.filter(u => u.id !== userId);
    
    console.log(`用戶 ${userId} 離開房間 ${roomId}`);
    res.json({ success: true });
});

// 測試端點
app.get('/test', (req, res) => {
    res.json({ 
        test: 'success', 
        message: '完整版測試端點正常',
        features: {
            httpApi: true,
            chatRooms: true,
            messageStorage: true,
            userManagement: true
        }
    });
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('服務器錯誤:', err);
    res.status(500).json({ error: '服務器內部錯誤', message: err.message });
});

// 404 處理
app.use((req, res) => {
    console.log('404 請求:', req.url);
    res.status(404).json({ error: '找不到請求的資源', url: req.url });
});

console.log(`🔧 嘗試在端口 ${PORT} 啟動完整服務器...`);

server.listen(PORT, () => {
    console.log(`🎉 完整聊天室服務器啟動成功！`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 啟動時間: ${new Date().toISOString()}`);
    console.log('🔗 可用的 API 端點:');
    console.log('   GET / - 服務器信息');
    console.log('   GET /health - 健康檢查');
    console.log('   GET /api/rooms - 獲取聊天室列表');
    console.log('   GET /api/rooms/:id/messages - 獲取聊天室訊息');
    console.log('   POST /api/rooms/:id/messages - 發送訊息');
    console.log('   POST /api/rooms/:id/join - 加入聊天室');
    console.log('   POST /api/rooms/:id/leave - 離開聊天室');
    console.log('🏠 預設聊天室:');
    Object.values(chatRooms).forEach(room => {
        console.log(`   - ${room.name} (${room.id}): ${room.description}`);
    });
}).on('error', (err) => {
    console.error('❌ 服務器啟動失敗:', err);
    console.error('🔍 錯誤詳情:', {
        code: err.code,
        errno: err.errno,
        syscall: err.syscall,
        address: err.address,
        port: err.port
    });
    process.exit(1);
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM，關閉服務器...');
    server.close(() => {
        console.log('服務器已關閉');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT，關閉服務器...');
    server.close(() => {
        console.log('服務器已關閉');
        process.exit(0);
    });
});

module.exports = { app, server };
