# FlowLedger AI Financial Platform

AI-Powered Personal & SaaS Financial Ledger with a **local Ollama Qwen** natural-language transaction parsing engine, split into **three isolated modules** sharing one API gateway:

| Module | Path | Port (dev) | Purpose |
| ------ | ---- | ---------- | ------- |
| **App** | `packages/app` | `:5173` → `/` | End-user financial ledger (dashboard, transactions, budgets, AI parsing, mobile simulator) |
| **Admin** | `packages/admin` | `:5174` → `/admin` | Business admin dashboard — tenant overview, user roster & RBAC (role: admin+) |
| **Super Admin** | `packages/superadmin` | `:5175` → `/superadmin` | Root SaaS controls — provision tenants, rotate keys, DB backup, audit logs (role: superadmin) |
| **API Gateway** | `api` | `:3000` | Express + Ollama gateway; enforces role-based access per module |

Architecture changes in one module cannot affect the others: they share **no components or state** — only the `packages/shared` library (types + API client) and the HTTP gateway. Each module is independently built and served.

## Run Locally

**Prerequisites:**  Node.js 18+, [Ollama](https://ollama.com)

1. Install dependencies (npm workspaces):
   `npm install`

2. Ensure Ollama is running with the Qwen model:
   `ollama serve` (in a separate terminal)
   `ollama pull qwen2.5:3b`

3. Configure Ollama in `.env.local` (optional — defaults to `http://localhost:11434` with model `qwen2.5:3b`):
   ```
   OLLAMA_HOST="http://localhost:11434"
   OLLAMA_MODEL="qwen2.5:3b"
   ```

4. Run everything in dev mode (gateway + 3 Vite apps):
   `npm run dev`
   - App: http://localhost:5173
   - Admin: http://localhost:5174
   - Super Admin: http://localhost:5175

5. Production build + single origin:
   `npm run build`
   `npm run start`
   - App: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - Super Admin: http://localhost:3000/superadmin

## Module Isolation

- The app parses natural-language financial text via the **local Qwen model** through Ollama (`/api/ai/parse`), with an automatic regex fallback parser if Ollama is unreachable.
- The gateway protects `/api/admin/*` (admin+) and `/api/superadmin/*` (superadmin only) via a demo role token; the App endpoints accept any authenticated user.
- `packages/shared` contains types, mock data, and the typed API client consumed by all three modules.

## Moving to a Real Server

The modules are configured so this is a **config-only switch** — no code changes needed.

1. **Separate the frontends onto subdomains** — in each of `packages/admin` and `packages/superadmin`, change `base` in `vite.config.ts` from `/admin/` / `/superadmin/` to `'/'`. They now serve at the root of their own subdomain.
2. **Point frontends at the API** — set `VITE_API_BASE` in each module's `.env` (e.g. `https://api.flowledger.com/api`). Leave empty for same-origin.
3. **Point the gateway at the GPU worker** — set `OLLAMA_HOST` to the private URL of the Ollama GPU server (and keep `OLLAMA_MODEL`).
4. **Enable CORS** — set `CORS_ORIGINS` on the gateway to the three frontend subdomains (comma-separated). Same-origin deployments leave it empty.
5. **Deploy each piece independently** — App / Admin / Super Admin as static sites (Vercel, Cloudflare Pages, or a static server), the API gateway as its own container/service, Ollama on the dedicated GPU box, and (production) Postgres for persistence plus real JWT auth.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Run gateway + all three frontend dev servers |
| `npm run build` | Bundle gateway + all three frontend modules |
| `npm run start` | Serve built app/admin/superadmin + API on `:3000` |
| `npm run lint` | Type-check all workspaces |
| `npm run dev:app` / `dev:admin` / `dev:superadmin` / `dev:api` | Run a single module |
