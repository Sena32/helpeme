# Economia de tokens ao desenvolver com IA

## Contexto
- Carregue o mínimo: `CLAUDE.md` + 1 tarefa + specs citadas por ID. Nunca "leia o projeto inteiro".
- Use Glob/Grep para localizar; leia arquivos com `offset/limit`. Não releia arquivo que acabou de editar.
- 1 tarefa por sessão; `/clear` entre tarefas; `/compact` se passar de ~60% do contexto.
- Specs pequenas e referenciadas por ID evitam repetir texto em prompts.

## Geração
- Edite com patches/edits em vez de reescrever arquivos inteiros.
- Gere em etapas (esqueleto → testes → implementação), não tudo de uma vez.
- Não explique o óbvio, não recapitule passos, não repita código na resposta final: informe arquivos alterados + resultado dos testes (1–3 linhas).
- Saída de comandos: filtre (`| tail -20`, `--silent`, `--reporter=dot`).
- Scaffolding por CLI (`nest g`, `npm create vite`, `npx shadcn add`) em vez de escrever boilerplate.

## Prompt-padrão por tarefa
```
Tarefa T-XX do docs/specs/07-roadmap.md. Leia só as specs citadas. Faça TDD (teste falhando primeiro),
siga .claude/rules. Ao final: rode os testes do módulo, commit com Conventional Commits e responda em ≤ 3 linhas.
```

## Quando delegar a subagentes
Somente para buscas amplas ou revisões independentes (ex.: auditoria final de segurança). Para o fluxo normal, trabalhe inline.
