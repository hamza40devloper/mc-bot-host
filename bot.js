const mineflayer = require('mineflayer');

// استقبال المتغيرات من server.js
const serverIp = process.argv[2];
const port = parseInt(process.argv[3]) || 25565;
const username = process.argv[4];
const versionArg = process.argv[5]; // المتغير الرابع هو الإصدار

let bot;

function createBot() {
    if (bot) {
        bot.removeAllListeners();
    }

    // معالجة الإصدار: إذا كان "false" نجعله قيمة بوليانية (Boolean) ليعمل الاكتشاف التلقائي
    let botVersion = false;
    if (versionArg && versionArg !== "false") {
        botVersion = versionArg;
    }

    bot = mineflayer.createBot({
        host: serverIp,
        port: port,
        username: username,
        version: botVersion, // استخدام الإصدار المحدد أو التلقائي
        viewDistance: "tiny"
    });

    bot.on('spawn', () => {
        console.log(`[BOT] ${username} joined ${serverIp}:${port} on version ${botVersion || 'Auto'}`);
    });

    bot.on('end', () => {
        console.log(`[BOT] ${username} Disconnected. Reconnecting in 10s...`);
        setTimeout(createBot, 10000);
    });

    bot.on('error', (err) => {
        console.error(`[BOT ERROR - ${username}]`, err.message);
    });
}

// ... (باقي الكود الخاص بـ process.on يبقى كما هو)

// استقبال الأوامر من السيرفر الأساسي (تبقى خارج الدالة)
process.on('message', (packet) => {
    if (packet.type === 'send_chat' && bot && bot.entity) { // التأكد من أن البوت متصل فعلياً
        try {
            bot.chat(packet.text);
            console.log(`[CHAT sent] ${packet.text}`);
        } catch (e) {
            console.error('[ERROR] Failed to send chat', e.message);
        }
    }
});

createBot();
