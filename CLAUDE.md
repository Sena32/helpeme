# HelpeMe — Contexto para IA (leia só isto primeiro)

Sistema interno de solicitações de TI. Monorepo: `frontend/` (React+Vite+TS), `backend/` (NestJS+TS), MongoDB e Docker Compose.

## Fluxo obrigatório por tarefa (economia de tokens)
1. Abra `docs/INDEX.md` e escolha UMA tarefa em `docs/specs/07-roadmap.md`.
2. Leia SOMENTE a spec citada na tarefa (IDs `RF-xx`, `RN-xx`, `API-xx`). Não leia o resto.
3. Rules carregam sozinhas por caminho em `.claude/rules/`. Não releia rules já carregadas.
4. TDD: teste falhando → código mínimo → refatorar. Rode apenas os testes do módulo.
5. Um commit por tarefa (Conventional Commits). Depois `/clear` e próxima tarefa.

## Regras inegociáveis
- Nomes de código em inglês e sugestivos; textos de UI em português (pt-BR).
- Zero credenciais no código. Tudo via variáveis de ambiente (`.env.example` é a fonte).
- TypeScript estrito; proibido `any` (use `unknown` + narrowing).
- Spec é a fonte da verdade: mudou comportamento → altere a spec antes do código.
- Não invente requisito. Dúvida → registre em `docs/specs/08-open-questions.md` e siga com a premissa documentada.
- Respostas curtas: sem recapitular o que foi feito, sem repetir código inteiro, use edits/diffs.

## Mapa
- Rules: `.claude/rules/*.md` · Specs: `docs/specs/*.md` · Template: `docs/specs/_template.md`
- Logo: `assets/logo.svg`, `assets/logo-icon.svg`
