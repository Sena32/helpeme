# SPEC-02 — Critérios de aceite (base dos testes TDD)
Status: ready · Nomeie cada teste com o `AC-xx`.

| ID | Given | When | Then | Req |
|---|---|---|---|---|
| AC-01 | visitante | cadastra com dados válidos | cria user `USER` e autentica | RF-01 |
| AC-02 | e-mail já existe (qualquer caixa) | cadastra | 409 | RN-01 |
| AC-03 | senha `abc123` | cadastra | 400 (política de senha) | RN-02 |
| AC-04 | corpo com `role: ADMIN` no cadastro público | cadastra | user criado como `USER` | RN-03 |
| AC-05 | credenciais corretas | faz login | 200 + cookie httpOnly | RF-02 |
| AC-06 | credenciais erradas ou e-mail inexistente | faz login | 401 com mensagem genérica idêntica | RF-02 |
| AC-07 | admin autenticado | `POST /users` com `ADMIN` | 201 | RF-03 |
| AC-08 | user comum | `POST /users` com `ADMIN` | 403 | RF-03 |
| AC-09 | banco vazio | executa seed duas vezes | 1 admin root e 5 categorias, sem duplicar | RF-04 |
| AC-10 | user autenticado | cria solicitação válida sem anexo | 201, status `OPEN`, prioridade nula | RF-05 |
| AC-11 | descrição com 49 ou 1001 chars | cria solicitação | 400 | RN-05 |
| AC-12 | arquivo `.pdf` ou `.png` renomeado de `.exe` | anexa | 400 (tipo/assinatura inválidos) | RN-06 |
| AC-13 | arquivo de 5 MB + 1 byte | anexa | 413/400 | RN-06 |
| AC-14 | 6 arquivos | anexa | 400 | RN-06 |
| AC-15 | user A e user B com solicitações | A lista/consulta | vê só as suas; detalhe de B → 404 | RF-06, RN-10 |
| AC-16 | user comum | `PATCH /requests/:id` | 403 | RF-06 |
| AC-17 | admin | lista solicitações | vê todas, ordenadas por prioridade desc e data desc por padrão | RF-07, RF-08 |
| AC-18 | admin | ordena por `createdAt` asc | ordem respeitada, paginação consistente | RF-08 |
| AC-19 | solicitação `OPEN` | admin define prioridade `HIGH` | persistida; `priorityRank=3` | RF-09 |
| AC-20 | solicitação `OPEN` | admin muda para `IN_PROGRESS` com observação | status e observação salvos | RF-10 |
| AC-21 | solicitação `IN_PROGRESS` | admin finaliza sem resolução | 400 | RN-08 |
| AC-22 | solicitação `IN_PROGRESS` | admin finaliza com resolução | `RESOLVED`, `resolvedAt` preenchido | RF-11 |
| AC-23 | solicitação `RESOLVED` | admin tenta alterar status | 409 | RN-07 |
| AC-38 | solicitação `OPEN` | admin tenta finalizar (`RESOLVED`) | 409; no front, "Finalizar" só aparece quando o status é "Em resolução" | RN-07 |
| AC-39 | admin no painel, solicitação não finalizada | escolhe a prioridade na lista suspensa da linha da tabela | prioridade salva (`PATCH {priority}`) sem abrir o detalhe; linha finalizada mostra só o badge | RF-09, RN-09 |
| AC-24 | admin | cria categoria "Segurança" | 201; repetir "segurança" → 409 | RF-12, RN-04 |
| AC-25 | user | cria solicitação com categoria inexistente | 400/404 | RN-11 |
| AC-26 | user | `GET /dashboard/summary` | contagens só das suas | RF-06 |
| AC-27 | admin | `GET /dashboard/summary` | contagens globais por status/prioridade/categoria | RF-07 |
| AC-28 | sem sessão | acessa rota protegida | 401; no front, redireciona ao login | RF-13 |
| AC-29 | user | acessa rota `/admin` no front | redirecionado/negado | RF-13 |
| AC-30 | anexo de outro user | user baixa | 404/403; admin → 200 | RF-14 |
| AC-31 | requisição qualquer | log gerado | JSON com `requestId` sem senha/token | RNF-04 |
| AC-32 | tema escuro | renderiza telas | tokens aplicados, sem cores fixas, contraste AA | RNF-05 |
| AC-33 | banco vazio e `SEED_USER_*` definidas | executa seed duas vezes | 1 usuário `USER` de teste (login funciona), sem duplicar; sem as variáveis, nenhum usuário de teste | RF-04 |
| AC-34 | admin, categoria ativa "RH" | desativa "RH" | 200 `isActive=false`; `GET /categories` não lista "RH"; nova solicitação com "RH" → 400; desativar de novo → 200 | RF-15, RN-12 |
| AC-35 | user comum | desativa categoria | 403 | RF-15 |
| AC-36 | categoria desativada | abre "Nova solicitação" ou o filtro de categoria do painel admin | categoria não aparece no select; em Categorias (UI-04) aparece como "Inativa" | RF-15 |
| AC-37 | qualquer formulário | digita valor inválido (ex.: descrição com 49 chars) e depois corrige (50 chars) | mensagem de erro aparece sem enviar e some ao corrigir | RN-13 |
| AC-40 | solicitação com anexo | clica na miniatura | modal na mesma página com a imagem ampliada; "Fechar" (ou `Esc`) fecha o modal | RF-14 |
| AC-41 | admin, solicitação `IN_PROGRESS` | clica em "Finalizar solicitação" (canto superior direito) | abre modal com a resolução; "Finalizar" sem resolução mostra erro; com resolução finaliza e fecha; "Cancelar" não altera nada | RF-11, RN-07/08 |
