# SPEC-04 — Modelo de dados
Status: ready · Collections: `users`, `categories`, `requests` (regras em `.claude/rules/05-mongodb.md`)

## Enums (TypeScript)
```ts
enum Role { Admin = 'ADMIN', User = 'USER' }
enum RequestStatus { Open = 'OPEN', InProgress = 'IN_PROGRESS', Resolved = 'RESOLVED' }
enum Priority { High = 'HIGH', Medium = 'MEDIUM', Low = 'LOW' }
// priorityRank: HIGH=3, MEDIUM=2, LOW=1, null→0
```

## users
| Campo | Tipo | Regras |
|---|---|---|
| _id | ObjectId | |
| name | string | 2–100, trim |
| email | string | único, lowercase, trim |
| passwordHash | string | bcrypt; `select:false` |
| role | Role | default `USER` |
| createdAt/updatedAt | Date | timestamps |

## categories
| Campo | Tipo | Regras |
|---|---|---|
| _id | ObjectId | |
| name | string | único (collation pt, strength 2), 2–50 |
| isDefault | boolean | true p/ as 5 do seed |
| isActive | boolean | default true |
| createdAt/updatedAt | Date | |

## requests
| Campo | Tipo | Regras |
|---|---|---|
| _id | ObjectId | |
| title | string | 5–120 |
| description | string | 50–1000 |
| category | ObjectId → categories | obrigatório |
| createdBy | ObjectId → users | obrigatório |
| status | RequestStatus | default `OPEN` |
| priority | Priority \| null | default null |
| priorityRank | number | 0–3, derivado |
| adminNote | string \| null | ≤ 500 |
| resolution | string \| null | ≤ 1000; obrigatório se `RESOLVED` |
| resolvedAt | Date \| null | |
| resolvedBy | ObjectId \| null | admin |
| attachments | Attachment[] | máx. 5 (embutido) |
| createdAt/updatedAt | Date | |

### Attachment (value object embutido)
`{ id: string(uuid), originalName: string, storedName: string, mimeType: 'image/jpeg'|'image/png', sizeBytes: number }`

## Seed
Categorias: Infra, Desenvolvimento, RH, Suporte Técnico, Outros (`isDefault: true`). Admin root: `ADMIN_ROOT_NAME/EMAIL/PASSWORD` do env (valores do desafio no `.env.example`).

## Índices
Ver tabela em `.claude/rules/05-mongodb.md` (não duplicar aqui).
