const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const Filter = require('bad-words');
const Database = require('./database');

const app = express();
const server = http.createServer(app);

// 生產環境配置
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

// 允許的前端域名 (請根據實際情況修改)
const allowedOrigins = isProduction 
    ? [
        'https://your-frontend-domain.com',
        'https://your-frontend-domain.netlify.app',
        'https://your-frontend-domain.vercel.app',
        'null', // 允許本地文件訪問
        // 添加您的實際前端域名
    ]
    : [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
        'http://localhost:5500',
        'null' // 允許本地文件訪問
    ];

// 安全性中間件
app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "wss:", "ws:"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
        }
    } : false
}));

// CORS 設定 - 簡化配置以支持測試
const corsOptions = {
    origin: true, // 暫時允許所有來源以便測試
    methods: ["GET", "POST"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Socket.IO 設定
const io = socketIo(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    // 生產環境優化
    pingTimeout: 60000,
    pingInterval: 25000
});

// 速率限制器
const rateLimiter = new RateLimiterMemory({
    keyFamily: 'middleware',
    points: isProduction ? 20 : 10, // 生產環境允許更多訊息
    duration: 60, // 60秒
});

// 不當言論過濾器
const filter = new Filter();

// 初始化資料庫（異步）
const db = new Database();

// 在線用戶管理
const onlineUsers = new Map();

// 預設聊天室
const DEFAULT_ROOMS = [
    { id: 'general', name: '💬 大廳', description: '大家一起聊天的地方', maxUsers: 50 },
    { id: 'study', name: '📚 學習討論', description: '學習方法、課業討論', maxUsers: 30 },
    { id: 'wellness', name: '🌱 心理健康', description: '心理健康相關話題', maxUsers: 25 },
    { id: 'exercise', name: '🏃‍♂️ 運動健身', description: '運動、健身話題交流', maxUsers: 20 },
    { id: 'music', name: '🎵 音樂分享', description: '音樂推薦、討論', maxUsers: 25 },
    { id: 'random', name: '🎲 隨便聊聊', description: '隨意聊天的地方', maxUsers: 40 }
];

function setupSocketHandlers() {
    const userRooms = new Map();

    // 工具函數
    function sanitizeMessage(text) {
        return text.trim().substring(0, 500);
    }

    function validateNickname(nickname) {
        if (!nickname || typeof nickname !== 'string') return false;
        if (nickname.length < 2 || nickname.length > 20) return false;
        if (filter.isProfane(nickname)) return false;
        return true;
    }

    // Socket.IO 事件處理
    io.on('connection', (socket) => {
        console.log(`用戶連接: ${socket.id} (${socket.handshake.address})`);

        // 用戶登入
        socket.on('user_login', async (userData) => {
            try {
                const { nickname, avatar } = userData;
                
                if (!validateNickname(nickname)) {
                    socket.emit('login_error', { message: '暱稱不符合規範' });
                    return;
                }

                const isNicknameInUse = Array.from(onlineUsers.values()).some(user => user.nickname === nickname);
                if (isNicknameInUse) {
                    socket.emit('login_error', { message: '暱稱已被使用，請選擇其他暱稱' });
                    return;
                }

                const user = {
                    id: socket.id,
                    nickname: nickname,
                    avatar: avatar || '#5c6bc0',
                    joinTime: new Date(),
                    status: 'online',
                    ip: socket.handshake.address
                };

                onlineUsers.set(socket.id, user);
                
                await db.logUserActivity(socket.id, nickname, 'login', socket.handshake.address, socket.handshake.headers['user-agent']);

                socket.emit('login_success', { 
                    user: user,
                    rooms: DEFAULT_ROOMS,
                    onlineCount: onlineUsers.size
                });

                socket.broadcast.emit('user_online', {
                    user: user,
                    onlineCount: onlineUsers.size
                });

                console.log(`用戶登入成功: ${nickname} (${socket.id}) from ${socket.handshake.address}`);

            } catch (error) {
                console.error('登入錯誤:', error);
                socket.emit('login_error', { message: '登入失敗，請稍後再試' });
            }
        });

        // 加入聊天室
        socket.on('join_room', async (roomId) => {
            try {
                const user = onlineUsers.get(socket.id);
                if (!user) {
                    socket.emit('error', { message: '請先登入' });
                    return;
                }

                const room = DEFAULT_ROOMS.find(r => r.id === roomId);
                if (!room) {
                    socket.emit('error', { message: '房間不存在' });
                    return;
                }

                const currentRoom = userRooms.get(socket.id);
                if (currentRoom) {
                    socket.leave(currentRoom);
                    socket.to(currentRoom).emit('user_leave_room', {
                        userId: socket.id,
                        nickname: user.nickname,
                        roomId: currentRoom
                    });
                }

                socket.join(roomId);
                userRooms.set(socket.id, roomId);

                const recentMessages = await db.getRoomMessages(roomId, 50);

                socket.emit('room_joined', {
                    roomId: roomId,
                    roomName: room.name,
                    messages: recentMessages
                });

                socket.to(roomId).emit('user_join_room', {
                    userId: socket.id,
                    nickname: user.nickname,
                    roomId: roomId
                });

                const systemMessage = {
                    id: `system_${Date.now()}`,
                    type: 'system',
                    content: `${user.nickname} 加入了聊天室`,
                    timestamp: new Date(),
                    roomId: roomId
                };

                io.to(roomId).emit('new_message', systemMessage);

                console.log(`${user.nickname} 加入房間: ${room.name}`);

            } catch (error) {
                console.error('加入房間錯誤:', error);
                socket.emit('error', { message: '加入房間失敗' });
            }
        });

        // 發送訊息
        socket.on('send_message', async (messageData) => {
            try {
                await rateLimiter.consume(socket.id);

                const user = onlineUsers.get(socket.id);
                const roomId = userRooms.get(socket.id);

                if (!user || !roomId) {
                    socket.emit('error', { message: '請先加入聊天室' });
                    return;
                }

                let content = sanitizeMessage(messageData.content);
                if (!content) {
                    socket.emit('error', { message: '訊息內容不能為空' });
                    return;
                }

                if (filter.isProfane(content)) {
                    socket.emit('error', { message: '訊息包含不當內容，請重新輸入' });
                    return;
                }

                const message = {
                    id: `msg_${Date.now()}_${socket.id}`,
                    type: 'text',
                    content: content,
                    author: user.nickname,
                    authorId: socket.id,
                    avatar: user.avatar,
                    timestamp: new Date(),
                    roomId: roomId
                };

                await db.saveMessage(message);
                io.to(roomId).emit('new_message', message);

                console.log(`訊息發送: ${user.nickname} 在 ${roomId}: ${content}`);

            } catch (rejRes) {
                if (rejRes.remainingHits !== undefined) {
                    socket.emit('error', { 
                        message: `發送過於頻繁，請等待 ${Math.round(rejRes.msBeforeNext / 1000)} 秒後再試` 
                    });
                } else {
                    console.error('發送訊息錯誤:', rejRes);
                    socket.emit('error', { message: '發送訊息失敗' });
                }
            }
        });

        // 打字指示器
        socket.on('typing_start', () => {
            const user = onlineUsers.get(socket.id);
            const roomId = userRooms.get(socket.id);
            
            if (user && roomId) {
                socket.to(roomId).emit('user_typing', {
                    userId: socket.id,
                    nickname: user.nickname
                });
            }
        });

        socket.on('typing_stop', () => {
            const roomId = userRooms.get(socket.id);
            if (roomId) {
                socket.to(roomId).emit('user_stop_typing', {
                    userId: socket.id
                });
            }
        });

        // 獲取在線用戶列表
        socket.on('get_online_users', () => {
            const roomId = userRooms.get(socket.id);
            if (roomId) {
                const roomUsers = Array.from(onlineUsers.values()).filter(user => 
                    userRooms.get(user.id) === roomId
                );
                socket.emit('online_users_list', roomUsers);
            }
        });

        // 用戶斷線
        socket.on('disconnect', async () => {
            const user = onlineUsers.get(socket.id);
            const roomId = userRooms.get(socket.id);

            if (user) {
                console.log(`用戶斷線: ${user.nickname} (${socket.id})`);

                await db.logUserActivity(socket.id, user.nickname, 'logout');

                if (roomId) {
                    socket.to(roomId).emit('user_leave_room', {
                        userId: socket.id,
                        nickname: user.nickname,
                        roomId: roomId
                    });

                    const systemMessage = {
                        id: `system_${Date.now()}`,
                        type: 'system',
                        content: `${user.nickname} 離開了聊天室`,
                        timestamp: new Date(),
                        roomId: roomId
                    };

                    socket.to(roomId).emit('new_message', systemMessage);
                }

                onlineUsers.delete(socket.id);
                userRooms.delete(socket.id);
                io.emit('online_count_update', onlineUsers.size);
            }
        });
    });
}

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        onlineUsers: onlineUsers.size,
        version: '1.0.0'
    });
});

// API 路由
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        onlineUsers: onlineUsers.size,
        version: '1.0.0'
    });
});

app.get('/api/rooms', (req, res) => {
    const roomsWithStats = DEFAULT_ROOMS.map(room => ({
        ...room,
        onlineUsers: Array.from(userRooms?.values() || []).filter(roomId => roomId === room.id).length
    }));
    res.json(roomsWithStats);
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '伺服器內部錯誤' });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: '找不到請求的資源' });
});

// 啟動服務器
async function startServer() {
    try {
        await db.initialize();
        console.log('🔧 資料庫初始化完成');
        
        setupSocketHandlers();
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 聊天室服務器啟動成功！`);
            console.log(`📡 服務器地址: http://0.0.0.0:${PORT}`);
            console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`👥 支援的聊天室: ${DEFAULT_ROOMS.length} 個`);
            console.log(`🔒 允許的來源: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        console.error('❌ 服務器啟動失敗:', error);
        process.exit(1);
    }
}

startServer();

// 優雅關閉
process.on('SIGTERM', async () => {
    console.log('收到 SIGTERM 信號，正在優雅關閉服務器...');
    server.close(() => {
        console.log('服務器已關閉');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('收到 SIGINT 信號，正在優雅關閉服務器...');
    server.close(() => {
        console.log('服務器已關閉');
        process.exit(0);
    });
});

module.exports = { app, server, io };
