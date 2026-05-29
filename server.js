const express = require('express');
const { fork } = require('child_process');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

// ================= الإعدادات =================
const PORT = process.env.PORT || 3000; 
const API_KEY = process.env.API_KEY || "YOUR_SECRET_KEY_HERE";
const activeBots = new Map();

// إعداد قاعدة البيانات
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ================= DATABASE =================
async function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS saved_bots (
            bot_id VARCHAR(100) PRIMARY KEY,
            server_ip VARCHAR(255) NOT NULL,
            username VARCHAR(100) NOT NULL,
            user_who_sent VARCHAR(100),
            saved_by_username VARCHAR(100),
            saved_by_user_id VARCHAR(100),
            is_saved_247 BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log('[DATABASE] Ready');
        await restoreBotsFromDatabase();
    } catch (err) {
        console.error('[DATABASE ERROR]', err.message);
    }
}

// 1. تحديث دالة التشغيل لتستقبل الإصدار
function launchBotProcess(botId, fullIp, username, userWhoSent, version) {
    let host = fullIp;
    let port = '25565';
    if (fullIp.includes(':')) {
        [host, port] = fullIp.split(':');
    }

    // تمرير الإصدار كمتغير رابع (بعد الـ host والـ port والـ username)
    const botProcess = fork('./bot.js', [host, port, username, version]);

    botProcess.botData = { botId, serverIp: fullIp, username, userWhoSent, version, isSaved247: false };
    activeBots.set(botId, botProcess);
    
    console.log(`[LAUNCH] ${username} on ${fullIp} (Version: ${version})`);
    botProcess.on('exit', () => activeBots.delete(botId));
}

// 2. تحديث نقطة النهاية (Endpoint) لاستقبال الإصدار من الواجهة
app.post('/api/start-bot', (req, res) => {
    if (req.headers['x-api-key'] !== API_KEY) return res.status(403).json({ error: 'Access Denied' });

    // استخراج الإصدار من الطلب
    const { serverIp, username, userWhoSent, version } = req.body;
    if (!serverIp || !username) return res.status(400).json({ error: 'Missing data' });

    const botId = `${username}_${Date.now()}`;
    
    // تمرير الإصدار، وإذا لم يكن موجوداً نعتبره "false" (تلقائي)
    launchBotProcess(botId, serverIp, username, userWhoSent || "زائر", version || "false");
    
    res.json({ success: true, botId });
});
