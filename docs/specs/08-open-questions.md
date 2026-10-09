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
