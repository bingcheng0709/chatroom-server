const express = require('express');
const http = require('http');

console.log('🚀 開始啟動聊天室服務器...');
console.log('📦 Node.js 版本:', process.version);
console.log('🌐 環境變量 NODE_ENV:', process.env.NODE_ENV);
console.log('🔌 環境變量 PORT:', process.env.PORT);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

console.log('✅ Express 應用已創建');
console.log(`🎯 將使用端口: ${PORT}`);

app.use(express.json());
console.log('✅ JSON 中間件已配置');

app.get('/', (req, res) => {
    console.log('收到根路徑請求');
    res.json({ 
        message: '大葉大學聊天室服務器運行中 - 基本版本',
        status: 'ok',
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
        memory: process.memoryUsage()
    });
});

app.get('/test', (req, res) => {
    res.json({ test: 'success', message: '測試端點正常' });
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

console.log(`🔧 嘗試在端口 ${PORT} 啟動服務器...`);

server.listen(PORT, () => {
    console.log(`🎉 基本服務器啟動成功！`);
    console.log(`📡 端口: ${PORT}`);
    console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 啟動時間: ${new Date().toISOString()}`);
    console.log('🔗 可以通過以下路由訪問:');
    console.log('   GET / - 主頁');
    console.log('   GET /health - 健康檢查');
    console.log('   GET /test - 測試端點');
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
