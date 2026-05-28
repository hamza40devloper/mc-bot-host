const express = require('express');
const { fork } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.API_KEY || "YOUR_SECRET_KEY_HERE";
const DB_FILE = path.join(__dirname, 'bots.json');
const activeBots = new Map();

// دالة لحفظ البوتات الحالية في ملف JSON
function saveBotsToDisk() {
    const data = [];
    for (const [botId, bot] of activeBots.entries()) {
        data.push({ botId, serverIp: bot.serverIp, port: bot.port, username: bot.username });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// دالة لتشغيل البوت وإدارته برمجياً
function launchBotProcess(botId, serverIp, port, username) {
    // تحديد استهلاك الرام للعملية الفرعية بـ 40 ميجابايت كحد أقصى (تحسين الأداء)
    const botProcess = fork('./bot.js', [serverIp, port, username], {
        execArgv: ['--max-old-space-size=40'] 
    });

    // تخزين البيانات الإضافية في كائن العملية
    botProcess.serverIp = serverIp;
    botProcess.port = port;
    botProcess.username = username;

    activeBots.set(botId, botProcess);

    botProcess.on('exit', () => {
        activeBots.delete(botId);
        saveBotsToDisk();
    });
}

// استعادة البوتات تلقائياً عند إعادة تشغيل سيرفر Railway
if (fs.existsSync(DB_FILE)) {
    try {
        const savedBots = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        console.log(`[SYSTEM] Restoring ${savedBots.length} bots from backup...`);
        savedBots.forEach(b => {
            const newId = `${b.username}_${Date.now()}`;
            launchBotProcess(newId, b.serverIp, b.port, b.username);
        });
    } catch (e) {
        console.error("[SYSTEM] Failed to load backup file", e);
    }
}

// API تشغيل البوت
app.post('/api/start-bot', (req, res) => {
    if (req.headers['x-api-key'] !== API_KEY) {
        return res.status(403).json({ error: 'Invalid API Key' });
    }

    const { serverIp, port, username } = req.body;
    if (!serverIp || !username) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    // منع تشغيل نفس اسم البوت مرتين لتجنب تضارب الاتصال
    for (const activeBot of activeBots.values()) {
        if (activeBot.username === username && activeBot.serverIp === serverIp) {
            return res.status(400).json({ error: 'This bot username is already running on this server' });
        }
    }

    const botId = `${username}_${Date.now()}`;
    launchBotProcess(botId, serverIp, port || '25565', username);
    saveBotsToDisk();

    res.json({ success: true, botId, message: 'Bot configured for 24/7 run.' });
});

app.get('/api/status', (req, res) => {
    res.json({ online: true, activeBotsCount: activeBots.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SERVER] Production Backend online on port ${PORT}`);
});
