# SPEC-03 — Arquitetura e infraestrutura
Status: ready

## Estrutura do repositório
```
helpeme/
├─ backend/      # NestJS (ver .claude/rules/04-backend.md)
├─ frontend/     # React+Vite (ver .claude/rules/03-frontend.md)
├─ docs/specs/   # SDD
├─ assets/       # logo
├─ .claude/rules/
├─ docker-compose.yml  .env.example  .gitignore  README.md  CLAUDE.md
```

## Módulos do backend
`auth`, `users`, `categories`, `requests` (inclui `attachments`), `dashboard`, `database/seeds`, `common` (guards, filters, logging), `config`.

## Docker Compose (serviços)
| Serviço | Imagem/Build | Porta (env) | Observações |
|---|---|---|---|
| mongo | `mongo:7` | interna `27017` | volume `mongo-data`; root user via env; healthcheck `mongosh ping` |
| backend | `./backend` | `BACKEND_PORT` | depende de mongo healthy; volume `uploads-data` em `UPLOAD_DIR`; seed no boot |
| frontend | `./frontend` (build → nginx) | `FRONTEND_PORT` | proxy `/api` → backend (mesma origem, cookie simples) |

## Variáveis de ambiente (fonte: `.env.example`)
Backend: `NODE_ENV, BACKEND_PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, COOKIE_SECURE, CORS_ORIGIN, BCRYPT_ROUNDS, UPLOAD_DIR, MAX_UPLOAD_SIZE_MB, MAX_FILES_PER_REQUEST, RUN_SEED, ADMIN_ROOT_NAME, ADMIN_ROOT_EMAIL, ADMIN_ROOT_PASSWORD, LOG_LEVEL, PAGINATION_MAX_LIMIT, THROTTLE_TTL, THROTTLE_LIMIT`.
Frontend: `VITE_API_BASE_URL`. Mongo: `MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD, MONGO_DB_NAME`.

## Decisões (ADR curtas)
| # | Decisão | Motivo |
|---|---|---|
| ADR-1 | JWT em cookie httpOnly, SameSite=Lax | Mitiga XSS; proxy same-origin evita CORS complexo |
| ADR-2 | Mongoose + repository | Tipagem forte, schema/índices declarativos, testes fáceis |
| ADR-3 | Anexos em disco (volume Docker) com metadados embutidos | Simples e suficiente; trocável por S3 via interface `StorageService` |
| ADR-4 | `priorityRank` numérico | Ordenação correta por prioridade no Mongo |
| ADR-5 | Seed lê credenciais do env | Cumpre "sem credencial fixa"; `.env.example` traz os valores exigidos pelo desafio |
| ADR-6 | TanStack Query + hooks | Separa chamada de API da camada visual |
| ADR-7 | `mongodb-memory-server` nos testes | Testes rápidos sem depender do Docker |
