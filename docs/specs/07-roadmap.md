# SPEC-07 — Roadmap de tarefas (1 tarefa = 1 commit, TDD)
Status: ready · Marque `[x]` ao concluir. Cada tarefa lista as specs a ler.

## Fase 0 — Fundação
- [x] **T-01** Repo, `.gitignore`, `.env.example`, `docker-compose.yml`, README base, adicionar colaborador `ednaldotaurino`. · Ler: 03
- [x] **T-02** Scaffold backend NestJS (strict, ESLint sem `any`, Jest, config/env validada, `/health`, logger pino). · Ler: 03, rules 04
- [x] **T-03** Scaffold frontend Vite+TS, Tailwind, shadcn init, Vitest, tokens/dark mode, logo. · Ler: 06
- [x] **T-04** Dockerfiles + compose funcional (mongo/backend/frontend). · Ler: 03

## Fase 1 — Backend
- [x] **T-05** Users: model, repository, service, política de senha. · Ler: 04, RN-01/02
- [x] **T-06** Auth: register/login/logout/me, JWT cookie, guards, `@Public`, throttler. · Ler: 05 API-01..04, AC-01..06
- [x] **T-07** Roles: `RolesGuard`, `POST /users` (admin cria admin). · Ler: AC-07/08, RN-03
- [x] **T-08** Categories + seed (admin root e categorias, idempotente). · Ler: AC-09, AC-24
- [x] **T-09** Requests: criação sem anexo + validações + índices. · Ler: AC-10/11/25
- [x] **T-10** Upload: Multer, validação MIME/magic bytes/tamanho/quantidade, endpoint de download protegido. · Ler: AC-12..14, AC-30
- [x] **T-11** Listagem com escopo por role, paginação, ordenação data/prioridade, filtros. · Ler: AC-15..18
- [x] **T-12** Tratamento admin: prioridade, status, observação, resolução, transições. · Ler: AC-19..23
- [ ] **T-13** Dashboard summary (aggregate). · Ler: AC-26/27
- [ ] **T-14** Middleware de log estruturado + filtro global de erros. · Ler: AC-31

## Fase 2 — Frontend
- [ ] **T-15** Camada `api/` + client + env + tipos + hooks de auth; `AuthGuard`/`RoleGuard`. · Ler: 05, AC-28/29
- [ ] **T-16** Layout (sidebar/topbar/tema) + tela Login/Cadastro. · Ler: UI-01
- [ ] **T-17** Dashboard User + lista + detalhe leitura. · Ler: UI-06/08
- [ ] **T-18** Nova solicitação com upload e validações. · Ler: UI-07, AC-11..14
- [ ] **T-19** Dashboard Admin: KPIs + tabela ordenável/filtrável/paginada. · Ler: UI-02
- [ ] **T-20** Tratamento admin (prioridade, status, observação, finalizar). · Ler: UI-03
- [ ] **T-21** Categorias e Usuários (admin). · Ler: UI-04/05

## Fase 3 — Fechamento
- [ ] **T-22** Revisão de acessibilidade/contraste e dark mode em todas as telas. · Ler: rules 03, AC-32
- [ ] **T-23** Teste de fluxo ponta a ponta no Docker (smoke) e ajustes. · Ler: RNF-07
- [ ] **T-24** README final (instalação, execução, env, usuários de teste, solução, decisões). · Ler: rules 06
- [ ] **T-25** Auditoria final: lint, `tsc`, `grep any`, segredos, cobertura. · Ler: rules 00, 02

## Definition of Done (toda tarefa)
Teste vermelho→verde · lint e `tsc` ok · spec atualizada se mudou comportamento · commit Conventional · zero `any` e zero segredo no código.
