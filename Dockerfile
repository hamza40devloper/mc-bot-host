# استخدام نسخة جافا 8 المستقرة للسيرفرات القديمة 1.8.8
FROM openjdk:8-jre-slim

# تثبيت أداة wget لتحميل الملفات من الإنترنت
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل
WORKDIR /minecraft-retro

# نسخ الملفات النصية والإعدادات من الـ GitHub
COPY . .

# تحميل ملف تشغيل السيرفر (PaperSpigot 1.8.8) تلقائياً
RUN wget -O server.jar https://api.papermc.io/v2/projects/paper/versions/1.8.8/builds/445/downloads/paper-1.8.8-445.jar

# فتح منفذ الاتصال الخاص بماين كرافت
EXPOSE 25565

# أمر التشغيل المعتمد بالسيرفر
CMD ["java", "-Xms1G", "-Xmx1G", "-jar", "server.jar", "nogui"]
