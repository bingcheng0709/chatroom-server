const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'chatroom.db');
        this.isInitialized = false;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) {
                    console.error('資料庫連接錯誤:', err.message);
                    reject(err);
                } else {
                    console.log('✅ SQLite 資料庫連接成功');
                    try {
                        await this.initTables();
                        this.isInitialized = true;
                        resolve();
                    } catch (initErr) {
                        reject(initErr);
                    }
                }
            });
        });
    }

    // 初始化資料表
    async initTables() {
        return new Promise((resolve, reject) => {
            // 訊息表
            const createMessagesTable = `
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL DEFAULT 'text',
                    content TEXT NOT NULL,
                    author TEXT NOT NULL,
                    author_id TEXT NOT NULL,
                    avatar TEXT,
                    room_id TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_deleted BOOLEAN DEFAULT 0
                )
            `;

            // 用戶活動記錄表
            const createUserActivitiesTable = `
                CREATE TABLE IF NOT EXISTS user_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    nickname TEXT NOT NULL,
                    activity_type TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT
                )
            `;

            // 房間統計表
            const createRoomStatsTable = `
                CREATE TABLE IF NOT EXISTS room_stats (
                    room_id TEXT PRIMARY KEY,
                    total_messages INTEGER DEFAULT 0,
                    total_users INTEGER DEFAULT 0,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            let tablesCreated = 0;
            const totalTables = 3;

            const checkComplete = () => {
                tablesCreated++;
                if (tablesCreated === totalTables) {
                    // 創建索引
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp 
                                 ON messages(room_id, timestamp DESC)`);
                    this.db.run(`CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp 
                                 ON user_activities(timestamp DESC)`);
                    console.log('✅ 所有資料庫表格初始化完成');
                    resolve();
                }
            };

            this.db.run(createMessagesTable, (err) => {
                if (err) {
                    console.error('創建 messages 表失敗:', err);
                    reject(err);
                } else {
                    console.log('✅ messages 表創建成功');
                    checkComplete();
                }
            });

            this.db.run(createUserActivitiesTable, (err) => {
                if (err) {
                    console.error('創建 user_activities 表失敗:', err);
                    reject(err);
                } else {
                    console.log('✅ user_activities 表創建成功');
                    checkComplete();
                }
            });

            this.db.run(createRoomStatsTable, (err) => {
                if (err) {
                    console.error('創建 room_stats 表失敗:', err);
                    reject(err);
                } else {
                    console.log('✅ room_stats 表創建成功');
                    checkComplete();
                }
            });
        });
    }

    // 儲存訊息
    saveMessage(message) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO messages (id, type, content, author, author_id, avatar, room_id, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                message.id,
                message.type || 'text',
                message.content,
                message.author,
                message.authorId,
                message.avatar,
                message.roomId,
                message.timestamp
            ];

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('儲存訊息失敗:', err);
                    reject(err);
                } else {
                    // 更新房間統計
                    this.updateRoomStats(message.roomId);
                    resolve(this.lastID);
                }
            }.bind(this));
        });
    }

    // 獲取房間訊息
    getRoomMessages(roomId, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM messages 
                WHERE room_id = ? AND is_deleted = 0
                ORDER BY timestamp DESC 
                LIMIT ?
            `;

            this.db.all(sql, [roomId, limit], (err, rows) => {
                if (err) {
                    console.error('獲取房間訊息失敗:', err);
                    reject(err);
                } else {
                    // 將結果按時間正序排列（最舊的在前）
                    const messages = rows.reverse().map(row => ({
                        id: row.id,
                        type: row.type,
                        content: row.content,
                        author: row.author,
                        authorId: row.author_id,
                        avatar: row.avatar,
                        roomId: row.room_id,
                        timestamp: new Date(row.timestamp)
                    }));
                    resolve(messages);
                }
            });
        });
    }

    // 記錄用戶活動
    logUserActivity(userId, nickname, activityType, ipAddress = null, userAgent = null) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO user_activities (user_id, nickname, activity_type, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [userId, nickname, activityType, ipAddress, userAgent], function(err) {
                if (err) {
                    console.error('記錄用戶活動失敗:', err);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    // 更新房間統計
    updateRoomStats(roomId) {
        const sql = `
            INSERT OR REPLACE INTO room_stats (room_id, total_messages, total_users, last_activity)
            VALUES (
                ?,
                COALESCE((SELECT total_messages FROM room_stats WHERE room_id = ?), 0) + 1,
                (SELECT COUNT(DISTINCT author_id) FROM messages WHERE room_id = ?),
                CURRENT_TIMESTAMP
            )
        `;

        this.db.run(sql, [roomId, roomId, roomId], (err) => {
            if (err) console.error('更新房間統計失敗:', err);
        });
    }

    // 獲取房間統計
    getRoomStats(roomId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM room_stats WHERE room_id = ?`;
            
            this.db.get(sql, [roomId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || { 
                        room_id: roomId, 
                        total_messages: 0, 
                        total_users: 0, 
                        last_activity: null 
                    });
                }
            });
        });
    }

    // 刪除訊息（軟刪除）
    deleteMessage(messageId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE messages SET is_deleted = 1 WHERE id = ?`;
            
            this.db.run(sql, [messageId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // 獲取用戶活動記錄
    getUserActivities(limit = 100) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM user_activities 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;

            this.db.all(sql, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 清理舊資料
    cleanupOldData(daysToKeep = 30) {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            // 清理舊的用戶活動記錄
            const cleanupActivitiesSQL = `
                DELETE FROM user_activities 
                WHERE timestamp < ?
            `;

            // 軟刪除超過保留期的訊息
            const cleanupMessagesSQL = `
                UPDATE messages 
                SET is_deleted = 1 
                WHERE timestamp < ? AND is_deleted = 0
            `;

            this.db.run(cleanupActivitiesSQL, [cutoffDate.toISOString()], (err) => {
                if (err) {
                    console.error('清理用戶活動記錄失敗:', err);
                }
            });

            this.db.run(cleanupMessagesSQL, [cutoffDate.toISOString()], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`清理了 ${this.changes} 條舊訊息`);
                    resolve(this.changes);
                }
            });
        });
    }

    // 資料庫備份
    backup(backupPath) {
        return new Promise((resolve, reject) => {
            const fs = require('fs');
            const sourceDb = fs.readFileSync(this.dbPath);
            
            try {
                fs.writeFileSync(backupPath, sourceDb);
                console.log(`資料庫備份完成: ${backupPath}`);
                resolve(backupPath);
            } catch (error) {
                console.error('資料庫備份失敗:', error);
                reject(error);
            }
        });
    }

    // 關閉資料庫連接
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error('關閉資料庫失敗:', err);
                    reject(err);
                } else {
                    console.log('資料庫連接已關閉');
                    resolve();
                }
            });
        });
    }

    // 獲取資料庫統計資訊
    getStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM messages WHERE is_deleted = 0) as total_messages,
                    (SELECT COUNT(DISTINCT author_id) FROM messages WHERE is_deleted = 0) as total_users,
                    (SELECT COUNT(DISTINCT room_id) FROM messages WHERE is_deleted = 0) as active_rooms,
                    (SELECT COUNT(*) FROM user_activities WHERE activity_type = 'login' AND date(timestamp) = date('now')) as today_logins
            `;

            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = Database;
