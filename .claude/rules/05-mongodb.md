---
paths:
  - "backend/**/schemas/**"
  - "backend/**/*.repository.ts"
  - "backend/src/database/**"
  - "docker-compose.yml"
---

# MongoDB — modelagem e desempenho

## Modelagem
- **Uma collection por entidade, obrigatório**: `users`, `categories`, `requests`. Nome da collection em inglês, plural, `snake_case`/minúsculo.
- Value objects pequenos e limitados (ex.: `attachments` da solicitação, máx. 5) ficam **embutidos** no documento pai; nunca arrays ilimitados.
- Referências entre entidades por `ObjectId` (`createdBy`, `category`); desnormalize só campos de leitura frequente e imutáveis (ex.: `categoryName` no listagem, se necessário).
- Todo schema com `timestamps: true`, `versionKey: false` (ou tratado), `strict: true`, `_id` ObjectId. Enums como `String` com `enum` validado.
- Validação no Mongoose **e** no DTO (defesa em profundidade). `email` sempre `lowercase`, `trim`.

## Índices (criar no schema, `autoIndex` desligado em produção e índices via migração/script)
| Collection | Índice | Motivo |
|---|---|---|
| users | `{ email: 1 }` unique | login, unicidade |
| categories | `{ name: 1 }` unique, collation `{locale:'pt', strength:2}` | unicidade case-insensitive |
| requests | `{ createdBy: 1, createdAt: -1 }` | dashboard/listagem do user |
| requests | `{ status: 1, priorityRank: -1, createdAt: -1 }` | tabela do admin (ordenação por prioridade/data) |
| requests | `{ createdAt: -1 }` | ordenação por data |
- Seguir regra ESR (Equality, Sort, Range). Conferir com `explain('executionStats')` nas queries principais; evitar COLLSCAN.
- Campo `priorityRank` (número: Alta=3, Média=2, Baixa=1, não classificada=0) mantido pelo service para ordenar por prioridade corretamente.

## Consultas
- **Paginação obrigatória** (`page`/`limit`, `limit` máx. por env); preferir `skip` pequeno ou keyset para grandes volumes.
- Usar projeção (`select`) e `lean()` em leituras; nunca devolver documento inteiro desnecessariamente.
- Contagens do dashboard via `aggregate` com `$group`/`$facet` em uma única ida ao banco, usando índices.
- Sem `populate` em cascata; no máximo um nível e com campos selecionados.
- Escritas atômicas (`findOneAndUpdate`) para mudança de status; transações só se realmente necessárias.

## Operação
- Mongo roda no Docker com volume nomeado (`mongo-data`), usuário/senha via env, healthcheck, sem porta exposta ao host em produção.
- Connection string só por `MONGODB_URI`. Pool configurável por env.
- Seed e migrações idempotentes.
