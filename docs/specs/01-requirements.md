# SPEC-01 — Requisitos
Status: ready

## Funcionais
| ID | Requisito |
|---|---|
| RF-01 | Cadastro público de usuário (nome, e-mail, senha) na tela de login; role sempre `USER`. |
| RF-02 | Login por e-mail e senha; retorna sessão autenticada. |
| RF-03 | Somente admin autenticado pode criar usuário com role `ADMIN`. |
| RF-04 | Seed cria admin root a partir de env, as 5 categorias padrão e, se configurado, um usuário de teste (`USER`) a partir de env (idempotente). |
| RF-05 | User cria solicitação: título, categoria, descrição (50–1000), 0..5 anexos JPG/PNG ≤ 5 MB cada. |
| RF-06 | User vê dashboard e lista com **apenas suas** solicitações, somente leitura (detalhe incluso). |
| RF-07 | Admin vê dashboard com métricas globais e **todas** as solicitações. |
| RF-08 | Admin vê tabela ordenável por data e por prioridade (padrão: prioridade desc, data desc). |
| RF-09 | Admin classifica prioridade: `HIGH`, `MEDIUM`, `LOW`. |
| RF-10 | Admin altera status para `IN_PROGRESS` ("em resolução") e adiciona observação. |
| RF-11 | Admin finaliza (`RESOLVED`) informando resolução (obrigatória). |
| RF-12 | Admin cria novas categorias; categorias padrão: Infra, Desenvolvimento, RH, Suporte Técnico, Outros. |
| RF-15 | Admin desativa categorias; seletores de categoria no front exibem somente categorias ativas. |
| RF-13 | Todas as telas protegidas por rota/role; logout. |
| RF-14 | Anexos acessíveis só ao dono da solicitação e a admins. |

## Regras de negócio
| ID | Regra |
|---|---|
| RN-01 | E-mail único (case-insensitive). |
| RN-02 | Senha: ≥ 8 chars com maiúscula, minúscula, número e caractere especial. |
| RN-03 | Cadastro público nunca cria `ADMIN`, mesmo se o corpo trouxer `role`. |
| RN-04 | Nome de categoria único (case-insensitive), 2–50 chars. |
| RN-05 | Título 5–120 chars; descrição 50–1000 chars (após trim). |
| RN-06 | Anexos: apenas `image/jpeg` e `image/png` (validar assinatura), ≤ 5 MB cada, máx. 5. |
| RN-07 | Transições válidas: `OPEN→IN_PROGRESS` e `IN_PROGRESS→RESOLVED`. Só é possível finalizar uma solicitação que está em resolução (`IN_PROGRESS`). `RESOLVED` é final. |
| RN-08 | Finalizar exige `resolution` não vazia (≤ 1000 chars); observação opcional (≤ 500). |
| RN-09 | Prioridade pode ser alterada enquanto não `RESOLVED`; sem prioridade = não classificada (ordena por último). |
| RN-10 | User só acessa recursos próprios (403/404 caso contrário). |
| RN-11 | Categoria da solicitação deve existir e estar ativa. |
| RN-12 | Desativar categoria é idempotente e não altera solicitações existentes (mantêm a categoria e continuam contando no dashboard); categoria inativa não aceita novas solicitações (RN-11). Seed não reativa categoria desativada. |
| RN-13 | Formulários do front validam a cada digitação (não só ao enviar), com as mesmas regras do envio. |

## Não funcionais
| ID | Requisito |
|---|---|
| RNF-01 | Sem credenciais no código; env validada na subida. |
| RNF-02 | TypeScript estrito, sem `any`. |
| RNF-03 | TDD; cobertura ≥ 80% em regras de negócio. |
| RNF-04 | Logs estruturados JSON com `requestId`, sem dados sensíveis. |
| RNF-05 | Acessibilidade WCAG AA, dark mode completo, responsivo (≥ 360px). |
| RNF-06 | Listagens paginadas (padrão 10, máx. 50); P95 < 300 ms com índices. |
| RNF-07 | `docker compose up --build` sobe tudo, com seed automático. |
| RNF-08 | Segurança: bcrypt, helmet, rate limit em auth, CORS restrito, validação de upload. |
