# Backend integration

The Java REST API this frontend talks to lives in a sibling repo and is deployed independently.

- **Repo:** [`Tech-do-Bem-FIAP/Backend_Java`](https://github.com/Tech-do-Bem-FIAP/Backend_Java)
- **Base URL (production):** `https://api-java-tdb.labs-lcs-server.com`
- **Stack:** Java 21 + Quarkus 3.15 + plain JDBC against FIAP Oracle.

## Setup

The base URL belongs in a Vite env var, not inline in code:

```bash
# .env.local (not committed)
VITE_API_URL=https://api-java-tdb.labs-lcs-server.com
```

```ts
const API = import.meta.env.VITE_API_URL;

const res = await fetch(`${API}/api/pacientes`);
const pacientes = await res.json();
```

## Endpoints

All responses are JSON. All collection routes accept `GET` (list) / `POST` (create); item routes accept `GET` (read), `PUT` (update), `DELETE` (delete).

| Resource | Collection | Item |
|---|---|---|
| Pacientes | `/api/pacientes` | `/api/pacientes/{id}` |
| Dentistas | `/api/dentistas` | `/api/dentistas/{id}` |
| Colaboradores | `/api/colaboradores` | `/api/colaboradores/{id}` |
| Campanhas | `/api/campanhas` | `/api/campanhas/{id}` |
| Atendimentos | `/api/atendimentos` | `/api/atendimentos/{id}` |
| Exames | `/api/exames` | `/api/exames/{id}` |
| Notificações | `/api/notificacoes` | `/api/notificacoes/{id}` |

`POST` returns `201 Created` with a `Location` header and the created resource in the body. `PUT` returns the updated resource. `DELETE` returns `204 No Content`.

Dates cross the wire as `yyyy-MM-dd` strings.

## Authentication

```http
POST /api/login
Content-Type: application/json

{ "email": "...", "senha": "..." }
```

Success — `200`:
```json
{ "tipo": "dentista", "id": 6, "nome": "Dra. Marina Lima" }
```

`tipo` is `"dentista"` or `"colaborador"` (the system matches against both tables). Wrong credentials → `400` with `{ "erro": "Email ou senha invalidos.", "status": 400 }`.

> **Note:** The CRUD endpoints currently do not enforce a session token. Whoever has the URL can `curl` and read/write data. The login endpoint exists for the frontend's gate; treat the returned object as identity, not as an auth assertion.

## CORS

Production frontend origin `https://techdobem.labs-lcs.com` is allowed. Other origins do **not** receive `Access-Control-Allow-Origin`, so browsers will block them.

**For local dev** (`http://localhost:5173`), pick one:

1. Add a vite proxy so browser calls go to the dev server, then server-to-server (no CORS):
   ```ts
   // vite.config.ts
   export default defineConfig({
     plugins: [react(), tailwindcss()],
     server: {
       proxy: {
         '/api': 'https://api-java-tdb.labs-lcs-server.com',
       },
     },
   });
   ```
   Then call `fetch('/api/pacientes')` — no `VITE_API_URL` prefix in dev.

2. Or temporarily widen CORS on the backend (`src/main/resources/application.properties` → `quarkus.http.cors.origins`) — requires a backend deploy.

The proxy approach is preferred; it leaves the production CORS scope tight.

## Errors

The backend uses a uniform error envelope:

```json
{ "erro": "<message>", "status": 400, "timestamp": "2026-05-23T16:34:14Z" }
```

| Status | Cause |
|---|---|
| `400` | Invalid input (`DadoInvalidoException`) — bad date format, missing required field, invalid CPF/email, bad credentials. |
| `404` | Resource not found (`RecursoNaoEncontradoException`). |
| `500` | JDBC/database failure (`PersistenciaException`). Body says "Falha ao acessar o banco de dados". |

## Deploy notes (useful for debugging)

- Pushes to `main` on the backend repo auto-rebuild and roll the container (`tech-do-bem-backend-java`) on the labs-lcs server.
- Routing: Cloudflare Tunnel → nginx vhost `api-java-tdb.labs-lcs-server.conf` → `127.0.0.1:8080`.
- If the public URL returns `502 Bad Gateway`, the container is down (check the backend repo's Actions tab).
- If every endpoint returns `500` with the "Falha ao acessar o banco de dados" body, the DB credentials env vars are missing — backend concern, not a frontend issue.
