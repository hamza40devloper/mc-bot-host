# استخدام نسخة جافا 17
FROM openjdk:17-slim

# تثبيت الأدوات اللازمة
RUN apt-get update && apt-get install -y curl wget

WORKDIR /app

# تحميل ملف PaperMC مباشرة أثناء البناء (أحدث إصدار 1.20.x)
RUN wget -O paper.jar https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/495/downloads/paper-1.20.4-495.jar

# تحميل Playit.gg
RUN wget -O playit https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-x86_64 && chmod +x playit

# إعداد ملف الـ EULA تلقائياً
RUN echo "eula=true" > eula.txt

# تشغيل السيرفر و Playit معاً
CMD ["sh", "-c", "./playit & java -Xmx512M -Xms512M -jar paper.jar nogui"]
