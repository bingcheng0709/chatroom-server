const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// 基本 CORS 配置
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// 基本路由
app.get('/', (req, res) => {
    res.json({ 
        message: '大葉大學聊天室服務器運行中',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '服務器健康' });
});

// Socket.IO 設定
const io = socketIo(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

// 簡單的 Socket.IO 處理
io.on('connection', (socket) => {
    console.log('用戶連接:', socket.id);
    
    socket.emit('welcome', { message: '歡迎來到聊天室！' });
    
    socket.on('message', (data) => {
        console.log('收到訊息:', data);
        io.emit('message', data);
    });
    
    socket.on('disconnect', () => {
        console.log('用戶斷線:', socket.id);
    });
});

// 啟動服務器
server.listen(PORT, () => {
    console.log(`🚀 簡化聊天室服務器啟動成功！`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
