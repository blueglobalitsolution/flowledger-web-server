# FlowLedger AI Financial Platform

AI-Powered Personal & SaaS Financial Ledger with a **local Ollama Qwen** natural-language transaction parsing engine, with a React frontend and an Express API gateway:

| Module | Path | Port (dev) | Purpose |
| ------ | ---- | ---------- | ------- |
| **App** | `packages/app` | `:5173` → `/` | End-user financial ledger (dashboard, transactions, budgets, AI parsing, mobile simulator) |
| **API Gateway** | `api` | `:3000` | Express + Ollama gateway for the web app |
| **Mobile API** | `api-mobile` | `:3001` | Standalone Express backend for the mobile app |

Architecture changes in one module cannot affect the others: they share **no components or state** — only the `packages/shared` library (types + API client). Each module is independently built and served.

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

4. Run everything in dev mode (gateway + App):
   `npm run dev`
   - App: http://localhost:5173

5. Production build + single origin:
   `npm run build`
   `npm run start`
   - App: http://localhost:3000

## Module Isolation

- The app parses natural-language financial text via the **local Qwen model** through Ollama (`/api/ai/parse`), with an automatic regex fallback parser if Ollama is unreachable.
- `packages/shared` contains types, mock data, and the typed API client.

## Moving to a Real Server

The modules are configured so this is a **config-only switch** — no code changes needed.

1. **Point frontend at the API** — set `VITE_API_BASE` in the app's `.env` (e.g. `https://api.flowledger.com/api`). Leave empty for same-origin.
2. **Point the gateway at the GPU worker** — set `OLLAMA_HOST` to the private URL of the Ollama GPU server (and keep `OLLAMA_MODEL`).
3. **Deploy independently** — App as a static site, the API gateway as its own container/service, Ollama on the dedicated GPU box, and (production) Postgres for persistence plus real JWT auth.

## NGINX Configuration for Mobile API

To proxy requests for the mobile app to the new standalone `api-mobile` server running on port `3001`, you can add a dedicated location block to your NGINX configuration (e.g., for `flowledger.blueglobtech.com`).

```nginx
    # ==========================
    # FlowLedger Mobile API Server
    # ==========================
    location /api-mobile/ {
        # Proxy to the new standalone mobile API server on port 3001
        proxy_pass http://192.168.1.72:3001/;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
```

Make sure your mobile app is configured to use `https://flowledger.blueglobtech.com/api-mobile` as its `API_BASE`!

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Run gateway + frontend dev server |
| `npm run build` | Bundle gateway + frontend |
| `npm run start` | Serve built app + API on `:3000` |
| `npm run lint` | Type-check all workspaces |
| `npm run dev:app` / `dev:api` | Run a single module |
