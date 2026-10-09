<p align="center"><img src="assets/logo.svg" alt="HelpeMe" height="64"></p>

# HelpeMe

Portal interno de solicitações para o setor de TI: usuários abrem e acompanham chamados com anexos; administradores priorizam, tratam e finalizam, com dashboard de visibilidade.

> **Template do README final (T-24).** Substitua os trechos `TODO` ao concluir cada tarefa.

## Stack
React + Vite + TypeScript · NestJS + TypeScript · MongoDB · Docker/Docker Compose · shadcn/ui · Vitest · Jest.

## Como instalar
```bash
git clone <URL-do-repositorio>
cd helpeme
cp .env.example .env   # ajuste os valores se necessário
```
Pré-requisitos: Docker + Docker Compose (execução padrão) ou Node 20+ (execução local).

## Como executar
**Com Docker (recomendado)**
```bash
docker compose up --build
```
Frontend: http://localhost:8080 · API: http://localhost:3000/api · Swagger (se habilitado): http://localhost:3000/api/docs

**Local (sem Docker para as apps; Mongo via Docker)**
```bash
docker compose up -d mongo
# backend
cd backend && npm install && npm run start:dev
# frontend (outro terminal)
cd frontend && npm install && npm run dev
```
Testes: `npm test` em `backend/` e em `frontend/`; setup do repositório: `node --test tests/infra/repo-setup.test.mjs`.
Smoke ponta a ponta no Docker (passa pelo nginx): `./scripts/smoke.sh`; com banco vazio e projeto isolado: `SMOKE_FRESH=1 ./scripts/smoke.sh` (pare a stack padrão antes).

## Variáveis de ambiente
Veja `.env.example` (todas obrigatórias, exceto as marcadas como opcionais). TODO: tabela resumida com descrição de cada variável.

## Usuários para teste
| Perfil | E-mail | Senha |
|---|---|---|
| Admin (seed) | admin@admin.com | Admin123@ |
| User (seed) | user@test.com | User123@ |
| User | ou cadastre-se na tela de login | — |

## Solução (resumo)
TODO: 5–8 linhas — fluxo user/admin, dashboards, upload, categorias, priorização.

## Principais decisões
Consulte `docs/specs/03-architecture.md` (ADR-1…7). TODO: resumir as 5 mais relevantes (JWT em cookie httpOnly, repository pattern, `priorityRank`, anexos em volume, TDD/SDD).

## Processo de desenvolvimento
SDD + TDD: specs em `docs/specs/`, rules em `.claude/rules/`, commits pequenos por tarefa do roadmap.
