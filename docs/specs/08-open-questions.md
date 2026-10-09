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
| Q-14 | Limite de corpo no nginx para uploads | Resolvido na T-10: `client_max_body_size = MAX_UPLOAD_SIZE_MB × MAX_FILES_PER_REQUEST + 1` MB, calculado no entrypoint do nginx (sem env nova) |
| Q-15 | Índices com `autoIndex` desligado em produção | Criados explicitamente (`syncIndexes`) no seed/bootstrap da T-08 |
| Q-16 | Biblioteca de hash | `bcryptjs` (algoritmo bcrypt, sem build nativo no Alpine); custo via `BCRYPT_ROUNDS` |
| Q-17 | `forbidNonWhitelisted` × AC-04 (`role` no cadastro público) | `RegisterDto` aceita `role` (`@Allow`) e o descarta: 201 como `USER`; demais campos desconhecidos → 400 |
| Q-18 | Acesso a anexo de outro usuário (AC-30 permite 403/404) | 404, para não revelar a existência da solicitação/anexo |
| Q-19 | Padrões da listagem (API-09) | Ordenação padrão prioridade desc + data desc para todos os perfis (desempate `_id`); `limit` padrão 10, limitado a `PAGINATION_MAX_LIMIT`; `priority=UNSET` filtra não classificadas; `search` no título (case-insensitive); em prioridade asc as não classificadas vêm primeiro; `createdBy{name}` só para admin |
| Q-20 | AC-16 (user `PATCH` → 403) citado na T-11 | Testado na T-12, junto com a rota `PATCH /requests/:id` |
| Q-21 | Detalhes do `PATCH /requests/:id` | `RESOLVED` é somente leitura (qualquer alteração → 409); transição fora de RN-07 → 409; reenviar o status atual é permitido (só nota/prioridade mudam); `resolution` só ao finalizar (senão 400); `adminNote` vazia limpa a nota; corpo vazio → 400; escrita atômica com status esperado (concorrência → 409) |
| Q-22 | Detalhes do resumo do dashboard (API-13) | `byCategory` lista só categorias com solicitações, ordenado por contagem desc e nome asc; `byStatus`/`byPriority` sempre com todas as chaves (zeros); `recent` reutiliza a listagem (`createdAt` desc, escopo por role) |
| Q-23 | Formato de erro e logs | `message` é `string` ou `string[]` (lista vem da validação de DTO); `error` é a frase HTTP em inglês (código de máquina); `X-Request-Id` recebido é reaproveitado se seguro (≤128, `[A-Za-z0-9._-]`), senão gera UUID; logs só com método, URL, status, latência, `requestId`, `userId` |
| Q-24 | Rotas do front e home por perfil | USER: `/` (UI-06), `/solicitacoes/nova` (UI-07); ADMIN: `/admin` (UI-02), `/admin/categorias` (UI-04), `/admin/usuarios` (UI-05); `/login` (UI-01). Após login: rota pedida (`from`) ou home do perfil; perfil sem acesso à rota → home do seu perfil. Cadastro sem confirmação de senha (não pedido) |
| Q-25 | UI-06/UI-08 | KPIs do user: total, abertas, em resolução, finalizadas; lista do user ordenada por `createdAt` desc, 10 por página; detalhe em `/solicitacoes/:id` (404 → "não encontrada"); anexos exibidos via endpoint protegido (API-12) |
| Q-26 | Limites de upload no front (UI-07) | Constantes espelham RN-06 (5 anexos, 5 MB, JPG/PNG) porque a SPEC-03 só expõe `VITE_API_BASE_URL` ao front; validação no cliente inclui assinatura (magic bytes) só para feedback imediato — o backend continua sendo a fonte da verdade e seus erros 400/413 são exibidos. Após criar: toast e redireciona ao detalhe |
