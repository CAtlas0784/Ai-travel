# AI แนะนำสถานที่ท่องเที่ยวจังหวัดอุทัยธานี

เว็บแชตผู้ช่วยวางแผนเที่ยวจังหวัดอุทัยธานี ใช้ React/Vite เป็น frontend และ Express/Prisma/PostgreSQL เป็น backend พร้อมตัวอย่างโหมด demo ที่ไม่ต้องต่อฐานข้อมูลหรือ AI API

## เริ่มใช้งานบน Windows

1. ติดตั้ง Node.js 24 และเปิด `run.bat` ที่โฟลเดอร์นี้
2. เลือกเมนูที่ต้องการ:
   - `1` ดูหน้าเว็บตัวอย่าง ใช้คำตอบจำลอง ไม่เปิด API
   - `2` ทดลองเว็บและ API demo ข้อมูลอยู่ใน memory และหายเมื่อปิด API
   - `3` ใช้ PostgreSQL จริง ต้องตั้งค่า `apps/api/.env` ก่อน
   - `4` ตรวจ lint และ production build ในเครื่อง
   - `5` ตรวจเว็บและ API ที่ deploy แล้ว โดยกรอก URL ตอนรัน
3. ดูขั้นตอน setup/deploy เพิ่มเติมที่ [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

เมนูตรวจในเครื่องรัน ESLint, TypeScript, Prisma generation และ production build โปรเจกต์ยังไม่มี unit test หรือ end-to-end test suite ส่วนเมนูออนไลน์เป็น smoke check สำหรับหน้าเว็บ, `/health` และ CORS เท่านั้น

## โครงสร้าง

- `apps/web` — React, TypeScript, Vite และ Tailwind CSS
- `apps/api` — Express API, Prisma, PostgreSQL, JWT และบริการ AI
- `assets` — ภาพประกอบโครงงานต้นฉบับ
- `docs` — deployment guide และบันทึก/ข้อกำหนดโครงงาน
- `scripts` — helper scripts ที่เรียกผ่าน `run.bat`

## ความปลอดภัย

เก็บ API keys และค่าจริงของฐานข้อมูลใน `apps/api/.env` หรือ environment variables ของผู้ให้บริการเท่านั้น อย่า commit ไฟล์ `.env`; ใช้ `apps/api/.env.example` เป็นแม่แบบแทน
