const mineflayer = require('mineflayer');

const serverIp = process.argv[2];
const port = parseInt(process.argv[3]);
const username = process.argv[4];
const password = process.argv[5] || "Bot123123"; // كلمة مرور افتراضية للبوت مكرك

function createBot() {
    console.log(`[INFO] Starting bot ${username}...`);
    
    const bot = mineflayer.createBot({
        host: serverIp,
        port: port,
        username: username,
        version: false,
        viewDistance: "tiny", // تقليل مسافة الرؤية لتوفير الرام والسيرفر
    });

    // تحسين الأداء وتعطيل الميزات غير الضرورية
    bot.on('spawn', () => {
        bot.physics.enabled = true; // تفعيل الفيزياء الأساسية فقط لحمايته من السقوط
    });

    // 1. التعامل مع السيرفرات المكركة (الخطوة الأهم)
    bot.on('windowOpen', (window) => {
        // بعض السيرفرات تفتح واجهة (GUI) للتأكيد البشري (Captcha)، نغلقها إن وجدت
        bot.closeWindow(window);
    });

    bot.on('message', (jsonMsg) => {
        const message = jsonMsg.toString();
        
        // التحقق مما إذا كان السيرفر يطلب التسجيل أو تسجيل الدخول
        if (message.includes('/register')) {
            bot.chat(`/register ${password} ${password}`);
            console.log(`[AUTH] Registered with password: ${password}`);
        } else if (message.includes('/login')) {
            bot.chat(`/login ${password}`);
            console.log(`[AUTH] Logged in successfully.`);
        }
    });

    // 2. نظام منع الطرد الخامل (Anti-AFK)
    let afkInterval = setInterval(() => {
        if (bot && bot.entity) {
            // البوت سيقوم بالالتفات قليلاً كل 20 ثانية لمنع السيرفر من اعتباره خامل
            const randomYaw = (Math.random() - 0.5) * 2;
            bot.look(randomYaw, 0);
            bot.swingArm(); // أرجحة اليد لتأكيد النشاط
        }
    }, 20000);

    // 3. إعادة الاتصال الذكي 24/7
    bot.on('end', (reason) => {
        console.log(`[DISCONNECTED] Bot ${username} stopped. Reason: ${reason}`);
        clearInterval(afkInterval);
        bot.removeAllListeners();
        
        // إعادة الاتصال بعد 15 ثانية لتجنب الحظر الذكي (Spam-Join)
        setTimeout(createBot, 15000);
    });

    bot.on('error', (err) => {
        console.error(`[ERROR] Bot ${username} error:`, err.message);
    });
}

createBot();
