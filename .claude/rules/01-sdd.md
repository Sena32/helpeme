# SDD — Spec-Driven Development (base de todos os specs)

Specs ficam em `docs/specs/`. **Nenhum código sem spec.** Cada spec é curta, rastreável e testável.

## Ciclo
1. **Specify**: escrever/ajustar a spec (use `_template.md`).
2. **Plan**: quebrar em tarefas pequenas no `07-roadmap.md` (1 tarefa = 1 commit).
3. **Test (TDD)**: derivar testes dos critérios de aceite (Given/When/Then).
4. **Implement**: código mínimo que passa nos testes.
5. **Verify**: conferir critérios de aceite; atualizar spec se o comportamento mudou.

## Formato obrigatório de qualquer spec
- Cabeçalho: ID, título, status (`draft|ready|done`), dependências.
- Objetivo em ≤ 3 linhas.
- Requisitos com IDs estáveis: `RF-xx` (funcional), `RNF-xx` (não funcional), `RN-xx` (regra de negócio), `API-xx` (endpoint), `UI-xx` (tela).
- Critérios de aceite em Given/When/Then, cada um com ID `AC-xx` ligado a um requisito.
- Fora de escopo explícito.
- Premissas e perguntas abertas.

## Regras de escrita (economia de tokens)
- Tabelas e listas > parágrafos. Sem prosa redundante, sem repetir requisitos em outra spec: **referencie por ID**.
- Uma informação, um único lugar (fonte única da verdade).
- Spec grande (> 150 linhas) deve ser dividida.
- Alterou comportamento? Atualize a spec **no mesmo commit** do código.

## Rastreabilidade
- Todo teste cita o ID do critério no nome: `it('AC-12: rejects description shorter than 50 chars')`.
- Todo commit referencia a tarefa: `feat(requests): create request endpoint (T-08)`.
