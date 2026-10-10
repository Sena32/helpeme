<p align="center"><img src="assets/logo.svg" alt="HelpeMe" height="64"></p>

# HelpeMe

Portal interno de solicitações para o setor de TI. Usuários abrem e acompanham chamados com anexos de imagem; administradores classificam a prioridade, tratam, finalizam e acompanham tudo em um dashboard.

**Stack:** React 19 + Vite + TypeScript · NestJS 11 + TypeScript · MongoDB 7 · Docker Compose · Tailwind + shadcn/ui · TanStack Query · Vitest + Testing Library + MSW · Jest + Supertest.

## Como instalar

Pré-requisitos: **Docker** com **Docker Compose v2** (execução padrão). Para rodar as apps fora do Docker: **Node 22+** e npm.

```bash
git clone https://github.com/Sena32/helpeme.git
cd helpeme
cp .env.example .env   # os valores de exemplo já funcionam localmente
```

## Como executar

### Com Docker (recomendado)

```bash
docker compose up --build
```

Sobe `mongo`, `backend` e `frontend`; o backend cria os índices e roda o seed (admin root, usuário de teste e categorias padrão) na inicialização.

| O quê | Endereço |
|---|---|
| Aplicação | http://localhost:8080 |
| API (via nginx, mesma origem) | http://localhost:8080/api |
| API (direto no backend) | http://localhost:3000/api |
| Health check | http://localhost:8080/api/health |

### Local (apps com Node, Mongo no Docker)

O `docker-compose.dev.yml` expõe o Mongo apenas em `127.0.0.1:27017` (em produção ele não tem porta publicada).

```bash
# 1) Mongo
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mongo

# 2) Backend (outro terminal) — aponta para o Mongo local e grava anexos em ./uploads
cd backend && npm install
MONGODB_URI='mongodb://helpeme:change-me-mongo@localhost:27017/helpeme?authSource=admin' \
UPLOAD_DIR=./uploads npm run start:dev

# 3) Frontend (outro terminal) — http://localhost:5173, com proxy de /api para o backend
cd frontend && npm install && npm run dev
```

Backend e frontend leem o `.env` da raiz; variáveis passadas na linha de comando têm prioridade.

### Produção

Guia de deploy com MongoDB Atlas, backend no Render e frontend na Vercel: [docs/deploy-production.md](docs/deploy-production.md). A execução local acima não muda.

### Testes

| Comando | O que roda |
|---|---|
| `cd backend && npm test` | Jest: unitários, repositórios com `mongodb-memory-server` e e2e com Supertest |
| `cd frontend && npm test` | Vitest: hooks, schemas, telas com MSW, axe em todas as telas, contraste dos tokens |
| `node --test tests/infra/repo-setup.test.mjs` | Estrutura do repositório, Docker, `.env.example` e este README |
| `./scripts/smoke.sh` | Smoke ponta a ponta na stack Docker, passando pelo nginx |
| `SMOKE_FRESH=1 ./scripts/smoke.sh` | O mesmo smoke em um projeto isolado com banco vazio (pare a stack padrão antes) |

Qualidade: `npm run lint` e `npm run typecheck` em cada app.

## Variáveis de ambiente

Todas vêm do `.env` (modelo em `.env.example`); nenhuma credencial fica no código. O backend valida tudo na inicialização e não sobe se faltar algo.

| Variável | Uso | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente (`development`, `production`, `test`); em produção os índices não são criados automaticamente pelo Mongoose | `development` |
| `BACKEND_PORT` | Porta HTTP do backend (também usada pelo proxy do nginx e do Vite) | `3000` |
| `FRONTEND_PORT` | Porta publicada do frontend (nginx) | `8080` |
| `LOG_LEVEL` | Nível do log JSON (`fatal`…`trace`, `silent`) | `info` |
| `MONGO_INITDB_ROOT_USERNAME` | Usuário root criado pelo container do Mongo | `helpeme` |
| `MONGO_INITDB_ROOT_PASSWORD` | Senha do usuário root do Mongo | `change-me-mongo` |
| `MONGO_DB_NAME` | Nome do banco | `helpeme` |
| `MONGODB_URI` | String de conexão usada pelo backend | `mongodb://…@mongo:27017/helpeme?authSource=admin` |
| `JWT_SECRET` | Segredo de assinatura do JWT (use um valor longo e aleatório) | `change-me-…` |
| `JWT_EXPIRES_IN` | Validade da sessão (formato `ms`: `15m`, `1h`, `1d`) | `1h` |
| `COOKIE_SECURE` | Envia o cookie de sessão só por HTTPS (`true` em produção com TLS) | `false` |
| `BCRYPT_ROUNDS` | Custo do hash de senha | `10` |
| `CORS_ORIGIN` | Origem permitida para CORS. Validada, mas hoje não usada: o front acessa a API pela mesma origem (proxy) | `http://localhost:8080` |
| `THROTTLE_TTL` | Janela do rate limit de login/cadastro, em segundos | `60` |
| `THROTTLE_LIMIT` | Tentativas permitidas por janela | `10` |
| `RUN_SEED` | Roda o seed idempotente na inicialização | `true` |
| `ADMIN_ROOT_NAME` | Nome do admin root criado pelo seed | `Admin Root` |
| `ADMIN_ROOT_EMAIL` | E-mail do admin root | `admin@admin.com` |
| `ADMIN_ROOT_PASSWORD` | Senha do admin root (segue a política de senha) | `Admin123@` |
| `SEED_USER_NAME` | Opcional: nome do usuário de teste (`USER`) | `Jose da Silva` |
| `SEED_USER_EMAIL` | Opcional: e-mail do usuário de teste | `user@test.com` |
| `SEED_USER_PASSWORD` | Opcional: senha do usuário de teste | `User123@` |
| `UPLOAD_DIR` | Pasta dos anexos (volume `uploads-data` no Docker) | `/app/uploads` |
| `MAX_UPLOAD_SIZE_MB` | Tamanho máximo por anexo | `5` |
| `MAX_FILES_PER_REQUEST` | Anexos por solicitação | `5` |
| `PAGINATION_MAX_LIMIT` | Maior `limit` aceito nas listagens | `50` |
| `VITE_API_BASE_URL` | Base da API usada pelo frontend (build) | `/api` |

`SEED_USER_*` são "tudo ou nada": defina as três ou nenhuma.

## Usuários para teste

| Perfil | Nome | E-mail | Senha |
|---|---|---|---|
| Admin (seed) | Admin Root | `admin@admin.com` | `Admin123@` |
| User (seed) | Jose da Silva | `user@test.com` | `User123@` |
| User | — | cadastre-se na tela de login | senha com 8+ caracteres, maiúscula, minúscula, número e caractere especial |

Admins podem listar, criar e editar usuários e administradores em **Usuários**.

## Solução

- **Usuário:** cadastra-se ou entra pela tela de login, abre solicitações com título, categoria, descrição (50–1000 caracteres) e até 5 imagens JPG/PNG de até 5 MB, com pré-visualização. Vê um painel com os próprios indicadores e a lista das suas solicitações, e acompanha no detalhe o status, a prioridade, a observação e a resolução do admin.
- **Administrador:** vê indicadores globais (total, abertas, em resolução, finalizadas, alta prioridade), gráficos por status e por categoria e uma tabela de todas as solicitações com busca, filtros, ordenação por prioridade ou data e paginação. No tratamento, classifica a prioridade, move para "Em resolução" com observação e finaliza informando a resolução. Também cria e desativa categorias, e lista (com busca e filtro por perfil), cria e edita usuários.
- **Regras garantidas no backend:** escopo por perfil (usuário só enxerga o que é seu; acesso indevido responde 404), transições de status válidas (`RESOLVED` é final), anexos validados por tipo, tamanho, quantidade e assinatura do arquivo.
- **Interface:** tema claro, escuro ou do sistema, contraste AA verificado nos tokens, navegação por teclado e textos em pt-BR.

## Principais decisões

1. **Sessão em cookie httpOnly com mesma origem.** O JWT fica em cookie `httpOnly` e `SameSite=Lax`, fora do alcance de JavaScript. O nginx (e o Vite, localmente) faz proxy de `/api`, então não há CORS nem token no `localStorage`. Login e cadastro têm rate limit.
2. **Camadas Controller → Service → Repository.** As regras ficam nos services, e o acesso ao Mongo fica só nos repositories, o que facilita testar com fakes e com `mongodb-memory-server`.
3. **Ordenação por prioridade com `priorityRank`.** É um campo numérico derivado (Alta=3 … sem prioridade=0) com índices compostos seguindo a regra ESR, para ordenar e paginar de forma estável no Mongo. O dashboard sai de um único `aggregate` com `$facet`.
4. **Anexos em disco atrás de uma interface de storage.** Os arquivos ficam em memória até todos passarem pela validação de tipo e assinatura; só então vão para o volume, com nome UUID. Se algo falhar, nada fica gravado. O download é feito por endpoint autenticado com checagem de dono. Trocar por S3 exige apenas outra implementação da interface.
5. **Tratamento atômico e auditável.** As transições obedecem a uma função pura testada, e a gravação usa `findOneAndUpdate` condicionado ao status lido, o que evita sobrescrever alterações concorrentes (responde 409).
6. **Observabilidade e erros padronizados.** O log é JSON (pino) com `requestId`, `userId` e latência, sem dados sensíveis. Todo erro segue o formato `{ statusCode, error, message, requestId }` com mensagens em pt-BR.
7. **SDD + TDD.** As specs em `docs/specs/` são a fonte da verdade; cada tarefa do roadmap começou por um teste falhando e virou um commit. As premissas tomadas durante o desenvolvimento estão em `docs/specs/08-open-questions.md`.

## Estrutura

```
backend/    NestJS (src/modules: auth, users, categories, requests, dashboard; common; config; database/seeds)
frontend/   React (src: api, hooks, schemas, types, components, features)
docs/specs/ Especificações (visão, requisitos, critérios de aceite, arquitetura, dados, API, UI, roadmap)
tests/      Testes de infraestrutura e smoke ponta a ponta
scripts/    smoke.sh
```
