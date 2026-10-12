# Local testing and deployment

## Prerequisites

- Node.js 24 with npm
- PostgreSQL only for the persistent local mode or production
- Gemini/OpenAI API keys only for real AI responses

## Local modes

Run `run.bat` from the project root:

1. **Local preview** runs only the Vite frontend with mock AI responses. No API or database is required.
2. **Local demo** runs the frontend with the in-memory demo API. Registration and conversations are temporary and reset when the API process closes. Favorite and saved-place endpoints are placeholders in this mode and do not persist data.
3. **Local PostgreSQL** runs migrations and seed data before starting the API and frontend. On first run, the menu creates `apps/api/.env` from `apps/api/.env.example`; set `DATABASE_URL` and a private `JWT_SECRET`, then choose this option again.
4. **Local checks** runs `npm run lint` and `npm run build`. These are static/build checks; there is no unit or end-to-end test suite configured yet.
5. **Online smoke check** asks for the deployed website URL and API base URL, then checks that the website responds, the API `/health` endpoint returns `status: ok`, and the API allows the website origin through CORS. It does not log in, send a chat message, or call Gemini/OpenAI.

The local demo is for development only. Do not deploy `apps/api/src/demo-server.ts`; it intentionally uses temporary demo behavior instead of PostgreSQL-backed security and persistence.

## PostgreSQL local configuration

The menu creates `apps/api/.env` from the safe template when it is missing. Update the values for your local database:

```env
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/uthai_travel?schema=public"
PORT=4000
CLIENT_ORIGIN="http://127.0.0.1:5173"
JWT_SECRET="replace-with-a-private-random-secret-at-least-32-characters"
GEMINI_API_KEY=""
OPENAI_API_KEY=""
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=120
```

Keep `apps/api/.env` private. For a real AI response, set one or both provider keys in this backend file; never put provider keys in Vercel variables prefixed with `VITE_`.

## Deploy the API to Railway

Use repository `CAtlas0784/Ai-travel`, branch `dev-test`, and set the service root directory to `apps/api`. Attach PostgreSQL and configure:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<private random secret, at least 32 characters>
GEMINI_API_KEY=<optional Gemini key>
OPENAI_API_KEY=<optional OpenAI key>
CLIENT_ORIGIN=https://your-frontend-domain
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=120
```

The Railway configuration uses `npm install && npm run build` and `npm run db:deploy && npm start`. After deploy, open the generated API URL plus `/health`; a healthy response is `{ "status": "ok" }`.

## Deploy the frontend to Vercel

Import the same repository and branch, set the project root directory to `apps/web`, choose Vite, and configure:

- Build command: `npm run build`
- Output directory: `dist`
- `VITE_API_URL=https://your-railway-api-domain`
- `VITE_DEMO_MODE=false`

After Vercel gives you the final website origin, set that exact origin in Railway's `CLIENT_ORIGIN` and redeploy the API.

## Manual end-to-end check

After both services are online, use a browser to:

- Register and log in
- Start a chat and send a question
- Rename, pin, and delete a conversation
- Change theme and language settings
- Save or favorite a place if those controls are available in the current UI

The automated online smoke check verifies availability and CORS only; it does not replace these browser checks.
