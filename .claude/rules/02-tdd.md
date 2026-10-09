# TDD — Test-Driven Development (base de todos os testes)

## Ciclo Red → Green → Refactor
1. **Red**: escreva UM teste a partir de um `AC-xx` e veja falhar pelo motivo certo.
2. **Green**: escreva o mínimo de código para passar.
3. **Refactor**: limpe mantendo tudo verde. Commit ao fechar a tarefa.

## Regras
- Proibido escrever código de produção sem teste falhando antes.
- Estrutura AAA (Arrange, Act, Assert); um comportamento por teste; nomes descrevem o comportamento e citam o `AC-xx`.
- Testes independentes, determinísticos e rápidos. Sem dependência de ordem, relógio real ou rede externa (use fakes/mocks/fixtures).
- Mock apenas nas fronteiras (repositório, HTTP, disco). Não mocke o que está sendo testado.
- Cobertura mínima: 80% linhas/branches nos módulos de regra de negócio (services, hooks, utils). Cobertura não substitui bom teste.
- Bug encontrado → primeiro um teste que o reproduz, depois a correção.

## Pirâmide
| Nível | Backend | Frontend |
|---|---|---|
| Unitário (maioria) | Jest: services, guards, validators | Vitest: hooks, utils, schemas |
| Integração | Jest + Supertest + `mongodb-memory-server` | Vitest + Testing Library + MSW |
| E2E (poucos, fluxos críticos) | opcional: Supertest do fluxo completo | opcional: Playwright |

## Economia de tokens
- Rode somente os testes afetados (`vitest run <arquivo>`, `jest --testPathPattern <módulo>`), suíte completa apenas antes do commit.
- Não cole saída inteira de testes; resuma falhas (primeiras linhas do erro).
