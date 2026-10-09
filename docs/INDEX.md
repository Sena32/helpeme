# Índice de documentação (ponto de entrada da IA)

| Arquivo | Conteúdo | Quando ler |
|---|---|---|
| `specs/00-vision-scope.md` | Visão, escopo, atores, fora de escopo, premissas | Início do projeto |
| `specs/01-requirements.md` | RF / RNF / RN com IDs | Sempre que a tarefa citar um ID |
| `specs/02-acceptance.md` | Critérios Given/When/Then (`AC-xx`) | Ao escrever testes (TDD) |
| `specs/03-architecture.md` | Estrutura do repo, Docker, env, decisões (ADR) | Setup e infra |
| `specs/04-data-model.md` | Entidades, campos, enums, índices | Models/schemas/tipos |
| `specs/05-api-contract.md` | Endpoints `API-xx` | Controllers e `frontend/src/api` |
| `specs/06-ui-spec.md` | Paleta, tokens, telas `UI-xx`, dark mode | Frontend |
| `specs/07-roadmap.md` | Tarefas `T-xx` = 1 commit cada | **Sempre: escolha a tarefa aqui** |
| `specs/08-open-questions.md` | Premissas e dúvidas | Quando surgir ambiguidade |
| `specs/_template.md` | Template de spec nova | Ao criar spec |

Regras: `.claude/rules/` (carregadas automaticamente por caminho). Contexto raiz: `CLAUDE.md`.

## Mapa de rastreabilidade (resumo)
Requisito (`RF/RN`) → Critério (`AC`) → Teste (nome cita `AC`) → Código → Commit (cita `T-xx`).
