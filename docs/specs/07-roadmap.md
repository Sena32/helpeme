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
- [x] **T-13** Dashboard summary (aggregate). · Ler: AC-26/27
- [x] **T-14** Middleware de log estruturado + filtro global de erros. · Ler: AC-31

## Fase 2 — Frontend
- [x] **T-15** Camada `api/` + client + env + tipos + hooks de auth; `AuthGuard`/`RoleGuard`. · Ler: 05, AC-28/29
- [x] **T-16** Layout (sidebar/topbar/tema) + tela Login/Cadastro. · Ler: UI-01
- [x] **T-17** Dashboard User + lista + detalhe leitura. · Ler: UI-06/08
- [x] **T-18** Nova solicitação com upload e validações. · Ler: UI-07, AC-11..14
- [x] **T-19** Dashboard Admin: KPIs + tabela ordenável/filtrável/paginada. · Ler: UI-02
- [x] **T-20** Tratamento admin (prioridade, status, observação, finalizar). · Ler: UI-03
- [x] **T-21** Categorias e Usuários (admin). · Ler: UI-04/05

## Fase 3 — Fechamento
- [x] **T-22** Revisão de acessibilidade/contraste e dark mode em todas as telas. · Ler: rules 03, AC-32
- [x] **T-23** Teste de fluxo ponta a ponta no Docker (smoke) e ajustes. · Ler: RNF-07
- [x] **T-26** Seed de usuário de teste `USER` via env (`SEED_USER_*`: Jose da Silva / user@test.com / User123@ no `.env.example`) + README. · Ler: RF-04, AC-33
- [x] **T-24** README final (instalação, execução, env, usuários de teste, solução, decisões). · Ler: rules 06
- [ ] **T-25** Auditoria final: lint, `tsc`, `grep any`, segredos, cobertura. · Ler: rules 00, 02

## Fase 4 — Melhorias
- [x] **T-27** Desativar categoria: `PATCH /categories/:id/deactivate` (ADMIN, idempotente), `GET /categories?includeInactive=true` (ADMIN); UI-04 com status e ação "Desativar" (confirmação); selects de categoria só com ativas. · Ler: RF-15, RN-11/12, API-06/15, AC-34..36, UI-04
- [x] **T-28** Validação ao digitar em todos os formulários do front (login, cadastro, nova solicitação, tratamento, finalizar, categoria, usuário). · Ler: RN-13, AC-37, 06 (Formulários)

- [x] **T-29** Só finaliza a partir de "Em resolução" (RN-07): backend + UI-03 (Finalizar só em `IN_PROGRESS`, sem prioridade) + lista suspensa de prioridade na tabela da UI-02. · Ler: RN-07/09, AC-38/39, UI-02/03
- [x] **T-30** Documento de produção: MongoDB Atlas, backend no Render, frontend na Vercel, sem mudar a execução local. · Ler: 03
- [x] **T-31** Anexos abrem em modal na mesma página (imagem ampliada + fechar). · Ler: 06 (Galeria de anexos), AC-40
- [x] **T-32** "Finalizar" como modal acionado por botão em destaque no canto superior direito (só em "Em resolução"); hover discreto nos menus suspensos. · Ler: UI-03, 06 (Hover discreto), AC-41
- [x] **T-33** Hover discreto também em botões ghost/outline, badges-link, fechar do Dialog e Skeleton (sem `accent`). · Ler: 06 (Hover discreto)

## Definition of Done (toda tarefa)
Teste vermelho→verde · lint e `tsc` ok · spec atualizada se mudou comportamento · commit Conventional · zero `any` e zero segredo no código.
