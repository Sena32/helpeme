# SPEC-05 — Contrato da API
Status: ready · Prefixo `/api` · JSON · Auth por cookie httpOnly `access_token` · Erro padrão `{ statusCode, error, message, requestId }`

| ID | Método e rota | Acesso | Entrada | Saída / erros | Req |
|---|---|---|---|---|---|
| API-01 | `POST /auth/register` | público | `{name,email,password}` | 201 `{user}` + cookie · 400/409 | RF-01 |
| API-02 | `POST /auth/login` | público | `{email,password}` | 200 `{user}` + cookie · 401 | RF-02 |
| API-03 | `POST /auth/logout` | auth | — | 204 limpa cookie | RF-13 |
| API-04 | `GET /auth/me` | auth | — | 200 `{user}` | RF-13 |
| API-05 | `POST /users` | ADMIN | `{name,email,password,role}` | 201 `{user}` · 403/409 | RF-03 |
| API-06 | `GET /categories` | auth | query (ADMIN): `includeInactive=true` | 200 `[{id,name}]` (ativas); com `includeInactive` → `[{id,name,isActive}]` (todas); USER com `includeInactive` → 403 | RF-12, RF-15 |
| API-07 | `POST /categories` | ADMIN | `{name}` | 201 · 409 | RF-12 |
| API-08 | `POST /requests` | auth | `multipart/form-data`: `title,categoryId,description,files[]` | 201 `{request}` · 400/413 | RF-05 |
| API-09 | `GET /requests` | auth | query: `page,limit,sortBy(createdAt\|priority),order,status,categoryId,priority,search` | 200 `{items,total,page,limit}`; USER: só as suas | RF-06/07/08 |
| API-10 | `GET /requests/:id` | dono ou ADMIN | — | 200 `{request}` · 404 | RF-06 |
| API-11 | `PATCH /requests/:id` | ADMIN | `{priority?,status?,adminNote?,resolution?}` | 200 · 400/409 | RF-09/10/11 |
| API-12 | `GET /requests/:id/attachments/:attachmentId` | dono ou ADMIN | — | 200 stream da imagem · 404 | RF-14 |
| API-13 | `GET /dashboard/summary` | auth | — | 200 resumo (abaixo) | RF-06/07 |
| API-14 | `GET /health` | público | — | 200 `{status:'ok'}` | RNF-07 |
| API-15 | `PATCH /categories/:id/deactivate` | ADMIN | — | 200 `{id,name,isActive:false}` (idempotente) · 403/404 | RF-15 |
| API-16 | `GET /users` | ADMIN | query: `page,limit,search,role` | 200 `{items:PublicUser[],total,page,limit}` (cadastro mais recente primeiro) · 403 | RF-16 |
| API-17 | `PATCH /users/:id` | ADMIN | `{name?,email?,role?}` (ao menos um) | 200 `{user}` · 400/403/404/409 | RF-17, RN-14 |

## Resumo do dashboard (API-13)
```ts
{ total: number,
  byStatus: Record<RequestStatus, number>,
  byPriority: Record<Priority | 'UNSET', number>,   // ADMIN; USER recebe só contagens próprias
  byCategory: { categoryId: string; name: string; count: number }[],
  recent: RequestListItem[] }   // 5 mais recentes (escopo por role)
```

## Convenções
- `PublicUser`: `id,name,email,role,createdAt,updatedAt` (nunca `passwordHash`). `search` de API-16 busca no nome ou e-mail (case-insensitive).
- `RequestListItem`: `id,title,categoryName,status,priority,createdAt,createdBy{name}` (admin).
- Ordenação por prioridade usa `priorityRank` desc, desempate `createdAt` desc.
- Swagger em `/api/docs` (opcional) gerado dos DTOs.
