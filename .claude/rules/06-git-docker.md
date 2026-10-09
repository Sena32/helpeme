# Git, GitHub e Docker

## Git / GitHub
- Repositório **privado**; adicionar o avaliador `ednaldotaurino` como colaborador (Settings → Collaborators).
- Branch `main` estável; trabalho em `feat/<tarefa>`; merge por PR ou fast-forward. **Nunca um único commit gigante**: 1 tarefa do roadmap = 1 commit (ou poucos).
- Conventional Commits em inglês: `feat(auth): add login endpoint (T-05)`, `test(...)`, `fix(...)`, `docs(...)`, `chore(...)`, `refactor(...)`.
- Commit só com testes verdes + lint/tsc ok. Nunca commitar `.env`, uploads, `node_modules`, builds.
- `.gitignore` completo na raiz (env, node_modules, dist, uploads, coverage, volumes).

## Docker
- `docker-compose.yml` na raiz com serviços `mongo`, `backend`, `frontend`; um comando sobe tudo: `docker compose up --build`.
- Dockerfiles multi-stage (build → runtime enxuto), usuário não-root, `.dockerignore` em cada app.
- Config 100% via `env_file`/`environment` apontando para `.env`; nada de segredo na imagem.
- Healthchecks e `depends_on: condition: service_healthy`. Volumes nomeados: `mongo-data`, `uploads-data`.
- Portas e URLs vêm de variáveis (`BACKEND_PORT`, `FRONTEND_PORT`).

## README final (exigido pela avaliação)
Instalação · como executar frontend e backend (Docker e local) · variáveis de ambiente · usuário/senha de teste · resumo da solução · principais decisões. Template pronto em `README.md`.
