# استخدام نسخة جافا 21 المستقرة والمدعومة بالكامل للتحديثات الحديثة
FROM eclipse-temurin:21-jre-jammy

# تثبيت أداة wget لتحميل الملفات من الإنترنت
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل داخل حاوية Railway
WORKDIR /minecraft-retro-modern

# نسخ الملفات النصية والإعدادات من الـ GitHub
COPY . .

# 1. تحميل ملف تشغيل السيرفر المتوافق مع إصدارك (PaperSpigot 1.21.1)
RUN wget -O server.jar https://api.papermc.io/v2/projects/paper/versions/1.21.1/builds/130/downloads/paper-1.21.1-130.jar

# إنشاء مجلد البلجنات تلقائياً
RUN mkdir -p plugins

# 2. تحميل بلجن إرجاع نظام القتال والضرب السريع وإلغاء شحن الأسلحة (نظام 1.8.8)
RUN wget -O plugins/OldCombatMechanics.jar https://github.com/kernkraftritter/OldCombatMechanics/releases/download/v1.12.1/OldCombatMechanics.jar

# 3. تحميل بلجن حظر وصناعة الأدوات والبلوكات الحديثة
RUN wget -O plugins/ItemRestrict.jar https://github.com/LetNomad/ItemRestrict/releases/download/v1.0.0/ItemRestrict.jar

# فتح منفذ الاتصال الخاص بماين كرافت
EXPOSE 25565

# أمر التشغيل المعتمد لجافا 21
CMD ["java", "-Xms1G", "-Xmx1G", "-jar", "server.jar", "nogui"]
