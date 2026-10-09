# SPEC-00 — Visão e escopo
Status: ready

## Problema
O setor de TI recebe grande volume de solicitações internas: sobrecarga, falta de organização, sem visibilidade e sem acompanhamento.

## Solução
**HelpeMe**: portal de service desk interno. Usuários abrem solicitações com anexos e acompanham o andamento; administradores (TI) priorizam, tratam e finalizam, com dashboard de visibilidade.

## Atores
| Ator | Pode |
|---|---|
| Visitante | Entrar, cadastrar-se (sempre como `USER`) |
| User | Criar solicitações (com anexos), ver dashboard e lista **apenas das suas**, somente visualizar |
| Admin | Ver todas as solicitações e métricas; classificar prioridade; mudar status; observar; finalizar com resolução; criar categorias; criar novos admins |
| Admin root | Admin criado por seed (credenciais via env) |

## Escopo (MVP obrigatório)
Autenticação (login/cadastro) · roles · seed · dashboards por role · CRUD de solicitações conforme papéis · upload de imagens · categorias · tabela ordenável por data/prioridade · persistência MongoDB · Docker Compose · testes TDD · README.

## Fora de escopo (não implementar)
Edição/exclusão de solicitação pelo user · comentários/chat · notificações por e-mail · SLA automático · recuperação de senha · SSO · multi-tenant · exclusão de usuários.

## Diferenciais opcionais (só após o MVP verde)
Filtros por status/categoria/busca · histórico de alterações (audit trail) · gráfico por categoria/status · paginação com contagem · swagger publicado em `/api/docs`.

## Premissas adotadas (detalhes em 08-open-questions.md)
Status do ciclo: `OPEN → IN_PROGRESS → RESOLVED`. Prioridade inicia vazia e só o admin classifica. Máx. 5 anexos por solicitação. Sessão por JWT em cookie httpOnly.
