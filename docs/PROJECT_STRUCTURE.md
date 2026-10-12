# Project Structure

เอกสารนี้อธิบายโฟลเดอร์และไฟล์ที่มีอยู่จริงใน repository ปัจจุบัน โครงการแบ่งเป็น npm workspace สองส่วน: `apps/web` สำหรับ frontend และ `apps/api` สำหรับ backend โดยเอกสาร สคริปต์ และ asset ที่ไม่ใช่ source code แยกไว้นอก `apps/`

## แผนผัง

```text
.
├── .gitignore
├── .npmrc
├── .prettierrc
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
├── run.bat
├── apps/
│   ├── api/
│   │   ├── .env.example
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   ├── railway.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   │       └── 20260721000000_init/migration.sql
│   │   └── src/
│   │       ├── app.ts
│   │       ├── server.ts
│   │       ├── demo-server.ts
│   │       ├── config/env.ts
│   │       ├── lib/http.ts
│   │       ├── lib/prisma.ts
│   │       ├── middleware/auth.ts
│   │       ├── middleware/error.ts
│   │       ├── routes/
│   │       │   ├── auth.routes.ts
│   │       │   ├── chat.routes.ts
│   │       │   ├── conversation.routes.ts
│   │       │   ├── favorite.routes.ts
│   │       │   ├── place.routes.ts
│   │       │   ├── saved-place.routes.ts
│   │       │   ├── settings.routes.ts
│   │       │   └── user.routes.ts
│   │       ├── services/ai.service.ts
│   │       ├── types/express.d.ts
│   │       └── validation/schemas.ts
│   └── web/
│       ├── .env.example
│       ├── eslint.config.js
│       ├── index.html
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── main.tsx
│           ├── router.tsx
│           ├── types.ts
│           ├── vite-env.d.ts
│           ├── components/
│           │   ├── chat-panel.tsx
│           │   ├── left-sidebar.tsx
│           │   ├── markdown-message.tsx
│           │   ├── right-sidebar.tsx
│           │   └── ui/
│           │       ├── button.tsx
│           │       ├── input.tsx
│           │       └── label.tsx
│           ├── lib/api.ts
│           ├── lib/utils.ts
│           ├── providers/auth-provider.tsx
│           ├── screens/
│           │   ├── app-layout.tsx
│           │   ├── auth-shell.tsx
│           │   ├── login-page.tsx
│           │   └── register-page.tsx
│           └── styles/globals.css
├── assets/uthai-thani-project-illustration.bmp
├── docs/
│   ├── DEPLOYMENT.md
│   ├── PROJECT_BRIEF.txt
│   ├── PROJECT_NOTES.txt
│   └── PROJECT_STRUCTURE.md
└── scripts/
    ├── README.md
    ├── build-checks.bat
    ├── online-smoke-test.ps1
    └── setup-postgres.bat
```

ไม่มี `tests/` directory ใน repository ปัจจุบัน เพราะยังไม่ได้เพิ่ม unit test หรือ end-to-end test suite

## Root และ workspace

| Path | หน้าที่ |
| --- | --- |
| `package.json` | นิยาม npm workspaces, Node/npm version, คำสั่งพัฒนา, lint, build และ database |
| `package-lock.json` | lock เวอร์ชัน dependencies ของ workspace |
| `run.bat` | เมนูหลักสำหรับ preview, demo, PostgreSQL, local checks และ online smoke check บน Windows |
| `.gitignore` | กัน `.env`, dependencies, build output, logs และไฟล์ฐานข้อมูล local ออกจาก Git |
| `.npmrc` | การตั้งค่าการติดตั้ง dependency ของ npm |
| `.prettierrc` | รูปแบบการจัด format โค้ด |
| `LICENSE` | เงื่อนไขการใช้และแจกจ่ายโปรเจกต์ |

## Backend: `apps/api`

### จุดเริ่มต้นและ config

- `src/app.ts` สร้าง Express app, middleware ด้าน security/CORS/logging/rate limit และผูก route ต่าง ๆ
- `src/server.ts` เปิด PostgreSQL-backed API และจัดการการปิด connection
- `src/demo-server.ts` เปิด API ตัวอย่างแบบ in-memory สำหรับการพัฒนา local เท่านั้น
- `src/config/env.ts` โหลดและตรวจ environment variables ด้วย Zod
- `src/lib/prisma.ts` สร้าง Prisma Client
- `src/lib/http.ts` รวม error แบบ HTTP และ helper สำหรับ async routes

### Routes, services และ middleware

- `src/routes/` แยก route ตาม auth, chat, conversation, place, favorite, saved place, settings และ user
- `src/services/ai.service.ts` เรียก Gemini/OpenAI และเลือก provider fallback
- `src/middleware/auth.ts` ตรวจ JWT และแนบผู้ใช้กับ request
- `src/middleware/error.ts` แปลง validation/HTTP/unexpected errors เป็น HTTP response
- `src/validation/schemas.ts` นิยาม request validation ของ Zod
- `src/types/express.d.ts` เพิ่ม type ของผู้ใช้ให้ Express request

### Database และ deploy

- `prisma/schema.prisma` นิยาม PostgreSQL models, relations และ enums
- `prisma/migrations/` เก็บ SQL migration ที่ใช้สร้าง schema
- `prisma/seed.ts` ใส่สถานที่ตัวอย่าง เช่น หุบป่าตาด เขาสะแกกรัง วัดท่าซุง และน้ำตกไซเบอร์
- `.env.example` เป็นแม่แบบ config local ที่ปลอด secret จริง
- `railway.json` กำหนดคำสั่ง build และ start สำหรับ Railway

## Frontend: `apps/web`

- `src/main.tsx` สร้าง React root, auth provider และ router
- `src/router.tsx` กำหนด public/protected routes
- `src/providers/auth-provider.tsx` จัดการผู้ใช้ token, login, register และ logout
- `src/lib/api.ts` รวมการเรียก REST API และอ่าน Server-Sent Events สำหรับ chat
- `src/screens/` เก็บหน้า login, register, layout หลัก และ shell ของหน้า auth
- `src/components/` เก็บแผงแชต, sidebars, markdown renderer และ UI primitives
- `src/styles/globals.css` เก็บ global styles และ Tailwind layers
- `src/types.ts` รวม TypeScript types ที่ frontend ใช้ร่วมกัน
- `.env.example` ให้ค่าเริ่มต้นของ API URL และ demo mode

## Scripts: `scripts/`

- `build-checks.bat` รัน lint และ build checks; ไม่มีการรัน unit test
- `setup-postgres.bat` migrate schema และ seed ข้อมูลก่อนเปิด local PostgreSQL mode
- `online-smoke-test.ps1` เช็คหน้าเว็บ, API health และ CORS ระหว่าง origin
- `README.md` สรุปการใช้ helper scripts; ผู้ใช้ทั่วไปควรเริ่มจาก `run.bat`

## เส้นทางข้อมูลโดยย่อ

```text
Browser (apps/web)
  ├── AuthProvider และ lib/api.ts
  └── HTTP / Server-Sent Events
        ↓
Express app (apps/api/src/app.ts)
  ├── auth / validation / routes
  ├── AI service → Gemini หรือ OpenAI
  └── Prisma Client → PostgreSQL
```

โหมด preview สร้างคำตอบจำลองใน frontend โดยไม่เรียก API ส่วนโหมด demo ต่อ `demo-server.ts` และเก็บข้อมูลชั่วคราวใน memory โหมด PostgreSQL ใช้ `server.ts`, Prisma และฐานข้อมูลจริง
