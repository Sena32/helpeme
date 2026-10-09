# Regras gerais (sempre ativas)

## Código limpo
- Identificadores (variáveis, funções, classes, arquivos, rotas, campos) em **inglês**, nomes sugestivos e pronunciáveis. Proibido `data`, `tmp`, `x`, `handle2`, abreviações obscuras.
- Funções pequenas (≤ 20 linhas), uma responsabilidade, no máximo 3 parâmetros (senão, objeto tipado).
- Sem números/strings mágicos: constantes nomeadas ou enums (`RequestStatus`, `Priority`, `Role`).
- Sem comentários que repetem o código. Comente apenas o "porquê".
- Sem código morto, sem `console.log` (backend usa logger estruturado).
- Early return em vez de aninhamento profundo. Erros tratados com exceções tipadas, nunca engolidos.
- DRY só após a 3ª repetição; YAGNI: não construa o que a spec não pede.

## Configuração e segredos
- **Nenhuma credencial, URL, porta, segredo ou limite fixo no código.** Tudo via variáveis de ambiente.
- `.env` nunca vai para o Git. `.env.example` sempre atualizado (sem valores sensíveis reais).
- Backend valida env na inicialização (schema com `zod` ou `Joi`); falha rápida se faltar variável.
- Frontend só expõe variáveis `VITE_*` não sensíveis.

## TypeScript
- `strict: true`. Proibido `any` (inclui `as any`, `@ts-ignore`). Use `unknown`, generics, tipos de união.
- Tipos de domínio compartilhados documentados em `docs/specs/04-data-model.md`; DTOs validados na borda.

## Idioma
- Código e commits em inglês. UI, mensagens ao usuário e docs de spec em pt-BR.

## Segurança mínima
- Senhas com bcrypt (custo via env). Nunca logar senha, token ou dados sensíveis.
- Toda entrada externa é validada (DTO/zod). Nunca confiar em role vindo do cliente.

## Qualidade
- ESLint + Prettier + `tsc --noEmit` sem erros antes de cada commit.
