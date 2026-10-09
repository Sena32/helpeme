# SPEC-08 — Premissas e perguntas abertas
Status: draft · Premissa vale até alguém decidir o contrário.

| # | Ponto ambíguo no enunciado | Premissa adotada |
|---|---|---|
| Q-01 | Paleta de cores veio vazia (`[]`) | Paleta indigo/teal definida em SPEC-06 |
| Q-02 | "Colocar como em resolução" | Status `IN_PROGRESS` rotulado "Em resolução" |
| Q-03 | Fluxo de status | `OPEN→IN_PROGRESS→RESOLVED`; `OPEN→RESOLVED` permitido; sem reabertura |
| Q-04 | Prioridade padrão | Nula até o admin classificar; ordena por último |
| Q-05 | Quantidade de anexos | Máx. 5 por solicitação, 5 MB cada |
| Q-06 | Credenciais do admin root vs "sem credencial fixa" | Valores do desafio ficam em `.env.example`/README de teste; o código só lê env |
| Q-07 | "User pode apenas visualizar" | Sem editar/cancelar/excluir solicitação |
| Q-08 | Admin vê solicitações de outros admins | Sim, todas |
| Q-09 | Nome do sistema | "HelpeMe" (grafia do enunciado) |
| Q-10 | Admin pode desativar/excluir categoria | Fora do MVP; apenas criar (campo `isActive` reservado) |
| Q-11 | Versão do NestJS | Nest 11 (CommonJS); Nest 12 é só ESM e quebra Jest/ts-jest |
| Q-12 | Formato do `/health` | `GET /api/health` → `200 { "status": "ok" }`, público, sem checar Mongo (até T-05) |
| Q-13 | Tokens shadcn não definidos na SPEC-06 | Derivados da paleta: `*-foreground` = foreground/primary-foreground conforme contraste; `secondary`/`muted` `#F1F5F9`/`#1A2440`; `popover` = card; `input` = border. `accent` segue a SPEC (teal). Contraste AA validado em `design-tokens.test.ts` |
| Q-14 | Limite de corpo no nginx para uploads | Default do nginx (1 MB) mantido até T-10; lá definir `client_max_body_size` derivado de `MAX_UPLOAD_SIZE_MB × MAX_FILES_PER_REQUEST` (alterar SPEC-03 se exigir nova env) |
| Q-15 | Índices com `autoIndex` desligado em produção | Criados explicitamente (`syncIndexes`) no seed/bootstrap da T-08 |
| Q-16 | Biblioteca de hash | `bcryptjs` (algoritmo bcrypt, sem build nativo no Alpine); custo via `BCRYPT_ROUNDS` |
