# AI แนะนำสถานที่ท่องเที่ยวจังหวัดอุทัยธานี

เว็บแชตผู้ช่วยวางแผนเที่ยวจังหวัดอุทัยธานี พัฒนาด้วย React และ TypeScript มี Express API, PostgreSQL และ Prisma สำหรับโหมดใช้งานจริง พร้อมโหมดตัวอย่างที่เปิดดูหน้าเว็บหรือทดลอง flow ได้โดยไม่ต้องต่อฐานข้อมูล

> **สถานะโปรเจกต์:** ต้นแบบที่พัฒนาต่อได้ ยังไม่มี automated unit test หรือ end-to-end test และข้อมูลสถานที่ยังเป็นชุดตัวอย่าง

Repository: [CAtlas0784/Ai-travel](https://github.com/CAtlas0784/Ai-travel) · Branch ที่ใช้งาน: `dev-test`

## สารบัญ

- [ความสามารถ](#ความสามารถ)
- [เทคโนโลยี](#เทคโนโลยี)
- [เริ่มใช้งานบน Windows](#เริ่มใช้งานบน-windows)
- [โหมดใน runbat](#โหมดใน-runbat)
- [คำสั่งสำหรับนักพัฒนา](#คำสั่งสำหรับนักพัฒนา)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การตั้งค่า](#การตั้งค่า)
- [ภาพรวม API](#ภาพรวม-api)
- [การทำงานของ AI](#การทำงานของ-ai)
- [ฐานข้อมูล](#ฐานข้อมูล)
- [ตรวจสอบและทดสอบ](#ตรวจสอบและทดสอบ)
- [Deploy](#deploy)
- [ข้อจำกัดและสิ่งที่ควรทราบ](#ข้อจำกัดและสิ่งที่ควรทราบ)
- [เอกสารเพิ่มเติม](#เอกสารเพิ่มเติม)

## ความสามารถ

- หน้าเข้าสู่ระบบและสมัครสมาชิก
- หน้าหลักแบบสามคอลัมน์: รายการสถานที่และแชตทางซ้าย, พื้นที่สนทนาตรงกลาง, การตั้งค่าทางขวา
- เก็บบัญชีผู้ใช้ บทสนทนา และข้อความใน PostgreSQL เมื่อใช้ API จริง
- ค้นหา เปลี่ยนชื่อ ปักหมุด และลบบทสนทนา
- ตั้งค่า theme, ภาษา และ provider ของ AI
- API สำหรับรายการสถานที่ รายการโปรด และสถานที่ที่บันทึกไว้
- โหมด preview และ demo สำหรับพัฒนาโดยไม่ต้องใช้บริการ AI หรือฐานข้อมูลจริง

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion |
| Backend | Node.js 24, Express, TypeScript |
| Database | PostgreSQL และ Prisma |
| Authentication | JWT และ bcryptjs |
| AI providers | Gemini เป็น provider หลักในโหมด Auto และ OpenAI เป็น fallback |
| Deploy ที่เตรียมค่าไว้ | Railway สำหรับ API และ Vercel สำหรับเว็บ |

## เริ่มใช้งานบน Windows

### สิ่งที่ต้องติดตั้ง

- Windows 10 หรือใหม่กว่า
- Node.js 24.x และ npm 11.x
- PostgreSQL เฉพาะเมื่อเลือกโหมด PostgreSQL
- API key ของ Gemini หรือ OpenAI เฉพาะเมื่อต้องการคำตอบจาก AI จริง

### เปิดโปรเจกต์

1. Clone repository และ checkout branch `dev-test`:

   ```bash
   git clone --branch dev-test https://github.com/CAtlas0784/Ai-travel.git
   cd Ai-travel
   ```

2. ดับเบิลคลิก `run.bat` หรือเปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรัน:

   ```bat
   run.bat
   ```

3. เลือกโหมดจากเมนู หากยังไม่มี `node_modules` สคริปต์จะเรียก `npm install` ให้โดยอัตโนมัติ

เปิดเว็บ local ที่ `http://127.0.0.1:5173/` เมื่อเริ่มโหมดเว็บแล้ว หยุด server ด้วย `Ctrl+C`

## โหมดใน `run.bat`

| ตัวเลือก | ใช้ทำอะไร | ต้องมีอะไรเพิ่ม |
| --- | --- | --- |
| `1. Local preview` | เปิดเว็บอย่างเดียว คำตอบแชตเป็นข้อความจำลอง | Node.js และ npm |
| `2. Local demo` | เปิดเว็บกับ API แบบเก็บข้อมูลในหน่วยความจำ | Node.js และ npm; ไม่ต้องใช้ PostgreSQL หรือ AI key |
| `3. Local PostgreSQL` | เปิด API จริงและเว็บ พร้อม migrate และ seed ฐานข้อมูล | PostgreSQL และไฟล์ `apps/api/.env` ที่ตั้งค่าถูกต้อง; AI key เป็นตัวเลือก |
| `4. Local checks` | รัน ESLint และ production build ทั้ง API และเว็บ | ติดตั้ง dependencies แล้ว |
| `5. Online smoke check` | ตรวจหน้าเว็บที่ deploy, API `/health` และ CORS | URL ของเว็บและ API ที่เข้าถึงได้ |
| `0. Exit` | ปิดเมนู | — |

โหมด preview ใช้ mock ใน frontend โดยตรง ส่วนโหมด demo ใช้ API ที่เก็บข้อมูลชั่วคราว เมื่อปิด process ของ demo ข้อมูลจะหายไป

## คำสั่งสำหรับนักพัฒนา

เรียกจาก root ของ repository:

| คำสั่ง | ผลลัพธ์ |
| --- | --- |
| `npm install` | ติดตั้ง dependencies ของ workspace |
| `npm run dev` | เปิด API PostgreSQL และ frontend พร้อมกัน |
| `npm run dev:demo` | เปิด API demo ในหน่วยความจำและ frontend พร้อมกัน |
| `npm run lint` | รัน ESLint ใน API และ frontend |
| `npm run build` | สร้าง Prisma Client, ตรวจ TypeScript และ build frontend/API |
| `npm run db:migrate` | ใช้ Prisma Migrate สำหรับฐานข้อมูล local/development |
| `npm run db:seed` | เพิ่มข้อมูลสถานที่ตัวอย่างลงฐานข้อมูล |

`npm run dev` และคำสั่งฐานข้อมูลต้องมี PostgreSQL และค่าที่ถูกต้องใน `apps/api/.env` ก่อน

## โครงสร้างโปรเจกต์

```text
.
├── apps/
│   ├── api/       # Express API, AI service, Prisma และ PostgreSQL
│   └── web/       # React frontend, หน้า login/register และหน้าสนทนา
├── assets/        # ภาพประกอบของโครงงาน
├── docs/          # คู่มือ deploy, project brief, notes และแผนผังโครงสร้าง
├── scripts/       # helper scripts ที่เรียกจาก run.bat
├── package.json   # npm workspaces และคำสั่งระดับโปรเจกต์
├── package-lock.json
└── run.bat        # เมนูเริ่มใช้งานและตรวจระบบบน Windows
```

ดูแผนผังและหน้าที่ของไฟล์แต่ละส่วนที่ [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

## การตั้งค่า

### Backend

คัดลอก `apps/api/.env.example` เป็น `apps/api/.env` แล้วตั้งค่าให้ตรงกับเครื่อง ห้าม commit `.env` หรือใส่ API key ใน frontend

| ตัวแปร | จำเป็น | ค่าเริ่มต้น/คำอธิบาย |
| --- | --- | --- |
| `DATABASE_URL` | จำเป็นสำหรับ API จริง | connection string ของ PostgreSQL |
| `PORT` | ไม่จำเป็น | `4000` |
| `CLIENT_ORIGIN` | แนะนำให้กำหนด | origin ของเว็บ เช่น `http://127.0.0.1:5173`; ต้องตรงกับ origin ที่เปิดเว็บ |
| `JWT_SECRET` | จำเป็น | secret สำหรับเซ็น JWT; โค้ดกำหนดขั้นต่ำ 24 ตัวอักษร และแนะนำให้ใช้ secret สุ่มอย่างน้อย 32 ตัวอักษร |
| `GEMINI_API_KEY` | ไม่จำเป็น | ใส่เพื่อใช้ Gemini |
| `OPENAI_API_KEY` | ไม่จำเป็น | ใส่เพื่อใช้ OpenAI หรือ fallback |
| `OPENAI_MODEL` | ไม่จำเป็น | OpenAI model ID; ค่าเริ่มต้น `gpt-5.6-luna` |
| `RATE_LIMIT_WINDOW_MS` | ไม่จำเป็น | ช่วงเวลา rate limit; ค่าเริ่มต้น 900000 ms |
| `RATE_LIMIT_MAX` | ไม่จำเป็น | จำนวน request ต่อช่วงเวลา; ค่าเริ่มต้น 120 |

เมนู PostgreSQL จะสร้าง `apps/api/.env` จากไฟล์ตัวอย่างหากยังไม่มี จากนั้นให้แก้ `DATABASE_URL` และ `JWT_SECRET` แล้วเลือกตัวเลือก `3` อีกครั้ง

### Frontend

ค่าตัวอย่างอยู่ใน `apps/web/.env.example`:

| ตัวแปร | ค่า local | คำอธิบาย |
| --- | --- | --- |
| `VITE_API_URL` | `http://127.0.0.1:4000` | URL หลักของ API |
| `VITE_DEMO_MODE` | `true` | ใช้ mock preview; กำหนดเป็น `false` เพื่อใช้ auth/API จริง |

ตัวแปรที่ขึ้นต้นด้วย `VITE_` ถูกส่งไป frontend bundle ได้ จึงห้ามใส่ secret หรือ API key ในตัวแปรกลุ่มนี้

## ภาพรวม API

| Method | Path | การใช้งาน |
| --- | --- | --- |
| `GET` | `/health` | ตรวจว่า API process ตอบสนอง |
| `POST` | `/api/auth/register` | สมัครบัญชี |
| `POST` | `/api/auth/login` | เข้าสู่ระบบ |
| `GET` | `/api/auth/me` | อ่านผู้ใช้จาก access token |
| `POST` | `/api/chat` | ส่งคำถามและรับคำตอบ |
| `POST` | `/api/chat/stream` | ส่งคำถามผ่าน Server-Sent Events |
| `GET`, `POST` | `/api/conversations` | อ่านหรือสร้างบทสนทนา |
| `PATCH`, `DELETE` | `/api/conversations/:id` | แก้ชื่อ/ปักหมุด หรือลบบทสนทนา |
| `GET` | `/api/conversations/:id/messages` | อ่านข้อความในบทสนทนา |
| `GET` | `/api/places/trending` | อ่านสถานที่ตัวอย่างที่กำลังแนะนำ |
| `GET` | `/api/places/:id` | อ่านรายละเอียดสถานที่ |
| `GET`, `POST`, `DELETE` | `/api/favorites` และ `/api/favorites/:placeId` | จัดการสถานที่โปรด |
| `GET`, `POST`, `DELETE` | `/api/saved-places` และ `/api/saved-places/:placeId` | จัดการสถานที่ที่บันทึกไว้ |
| `GET`, `PATCH` | `/api/settings` | อ่านหรือแก้การตั้งค่าผู้ใช้ |
| `GET` | `/api/user/profile` | อ่าน profile ปัจจุบัน |

เส้นทางที่เกี่ยวกับบัญชีและข้อมูลส่วนบุคคลต้องส่ง `Authorization: Bearer <token>`; `/health` และเส้นทางอ่านสถานที่เป็น public

## การทำงานของ AI

- เมื่อเลือก `AUTO` ระบบเรียก Gemini ก่อน แล้วลอง OpenAI หาก provider แรกผิดพลาด
- เมื่อเลือก provider เฉพาะ ระบบเรียก provider นั้นก่อนและลองอีก provider เป็น fallback
- OpenAI ใช้ model ID จาก `OPENAI_MODEL` ซึ่งมีค่าเริ่มต้นเป็น `gpt-5.6-luna`
- system prompt ตั้งใจให้ตอบเรื่องจังหวัดอุทัยธานีเป็นภาษาไทย และกำชับไม่ให้แต่งข้อมูลที่ไม่ทราบ
- หากไม่มี provider key หรือทุก provider ผิดพลาด API จะตอบข้อความแจ้งว่า AI ไม่พร้อมใช้งาน

prompt เพียงอย่างเดียวไม่ใช่แหล่งข้อมูลยืนยันข้อเท็จจริง สถานที่ เวลาเปิด ค่าเข้า และข้อมูลเดินทางยังต้องตรวจสอบกับแหล่งข้อมูลจริง

## ฐานข้อมูล

Prisma schema อยู่ที่ `apps/api/prisma/schema.prisma` และ migration เริ่มต้นอยู่ที่ `apps/api/prisma/migrations/`:

- `User` — บัญชีผู้ใช้
- `Conversation` และ `Message` — ประวัติการสนทนา
- `Place` — ข้อมูลสถานที่
- `FavoritePlace` และ `SavedPlace` — สถานที่โปรดและรายการที่บันทึก
- `UserSettings` — theme, ภาษา และตัวเลือก AI

ใช้ `npm run db:migrate` เพื่อ migrate ฐานข้อมูล local และ `npm run db:seed` เพื่อใส่สถานที่ตัวอย่าง

## ตรวจสอบและทดสอบ

- เมนู `4` รัน ESLint และ production build ซึ่งตรวจ lint, TypeScript และ Prisma generation
- โปรเจกต์ยังไม่มี unit test หรือ end-to-end test suite
- เมนู `5` ตรวจเพียงการตอบสนองของหน้าเว็บ, สถานะ API `/health` และ CORS ระหว่าง origin ของเว็บกับ API
- `/health` ยืนยันว่า API process ตอบ HTTP ได้ แต่ไม่ได้ตรวจการเชื่อมต่อ PostgreSQL หรือการเรียก AI
- หลัง deploy ควรตรวจ flow จริงด้วย browser เพิ่มเติม เช่น สมัคร/เข้าสู่ระบบ ส่งแชต เปลี่ยน theme และจัดการบทสนทนา

## Deploy

แนวทางที่เตรียมไว้คือ API บน Railway และ frontend บน Vercel:

1. ตั้ง Railway service root เป็น `apps/api`, ต่อ PostgreSQL และกำหนด environment variables ของ backend
2. ตั้ง Vercel project root เป็น `apps/web`, ตั้ง `VITE_API_URL` เป็น URL ของ API และกำหนด `VITE_DEMO_MODE=false`
3. ตั้ง `CLIENT_ORIGIN` บน Railway ให้ตรงกับ origin จริงของเว็บ แล้ว deploy API ใหม่
4. เปิด API URL ตามด้วย `/health` เพื่อตรวจการตอบสนองเบื้องต้น

ดู environment variables, คำสั่ง deploy และ manual browser check ที่ [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## ข้อจำกัดและสิ่งที่ควรทราบ

- `apps/api/src/demo-server.ts` ใช้ข้อมูลชั่วคราวเพื่อพัฒนาเท่านั้น ห้าม deploy แทน API หลัก; ข้อมูลทุกอย่างหายเมื่อปิด process
- Preview และ demo ไม่ใช่การทดสอบ provider AI หรือ persistence จริง
- API ส่งบริบทล่าสุดให้ AI ไม่เกิน 12 ข้อความ; บทสนทนาที่ยาวกว่านั้นจะไม่ถูกส่งทั้งหมด
- ปุ่ม forgot password, profile, privacy, terms และแนบไฟล์ยังไม่เชื่อมกับ flow ที่สมบูรณ์
- ภาพประกอบใน `assets/` เป็นไฟล์ BMP ขนาดใหญ่ หากไม่จำเป็นต้องเก็บต้นฉบับใน Git ให้พิจารณาบีบอัดหรือใช้ Git LFS

## เอกสารเพิ่มเติม

- [แผนผัง Project Structure](docs/PROJECT_STRUCTURE.md)
- [คู่มือ local, environment และ deployment](docs/DEPLOYMENT.md)
- [บทสรุปข้อกำหนดโครงงาน](docs/PROJECT_BRIEF.txt)
- [บันทึกโครงงานต้นฉบับ](docs/PROJECT_NOTES.txt)
- [คำอธิบาย helper scripts](scripts/README.md)
