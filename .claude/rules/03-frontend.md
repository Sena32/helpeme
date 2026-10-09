---
paths:
  - "frontend/**"
---

# Frontend — React + Vite + TypeScript

## Stack obrigatória
React 18+, Vite, TypeScript `strict`, Tailwind CSS, **shadcn/ui obrigatório** para todo componente de UI base (Button, Input, Select, Table, Dialog, Card, Badge, Toast, Form, Tabs, Skeleton…). Não criar componente próprio se existe equivalente no shadcn; apenas compor/estender. Roteamento: React Router. Dados do servidor: TanStack Query. Formulários: React Hook Form + zod. Testes: **Vitest** + Testing Library + MSW (TDD, ver `02-tdd.md`).

## Arquitetura (separação de camadas)
```
src/
  api/          # única camada que chama HTTP (axios/fetch client + funções por recurso)
  hooks/        # useRequests, useCreateRequest… (TanStack Query sobre api/)
  schemas/      # zod (validação de formulários, espelha DTOs do backend)
  types/        # tipos de domínio
  components/ui # shadcn (gerado)
  components/   # componentes de apresentação reutilizáveis (sem fetch)
  features/     # auth/, requests/, dashboard/, categories/ (páginas + composição)
  lib/ utils/ config/  # env tipado (import.meta.env), helpers
```
- **Componentes visuais nunca chamam `fetch`/axios**; só consomem hooks. Hooks nunca renderizam JSX.
- Componentes puros e pequenos (≤ 150 linhas); lógica extraída para hooks/utils testáveis.
- Rotas protegidas por `AuthGuard` e `RoleGuard`; menus e ações filtrados por role (a verdade continua no backend).

## Design system
- Tokens em CSS variables (formato shadcn) definidos em `docs/specs/06-ui-spec.md`; **proibido hex/cores fixas em componentes**, usar tokens (`bg-background`, `text-muted-foreground`, `bg-primary`…).
- **Dark mode obrigatório**: tema `light|dark|system` via classe `dark`, persistido. Todo componente novo deve ser verificado nos dois temas; nada de `bg-white`/`text-black` literais.
- Tipografia com hierarquia: página `text-3xl font-semibold`, seção `text-xl font-semibold`, card `text-base font-medium`, corpo `text-sm`, auxiliar `text-xs text-muted-foreground`. Um único `h1` por tela.
- Dashboard moderno: KPI cards no topo → gráficos/resumos → tabela. Grid responsivo mobile-first (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`), espaçamento em escala de 4px, cards com `rounded-xl`, tabela com scroll horizontal no mobile.
- Estados obrigatórios em toda tela de dados: loading (Skeleton), vazio, erro (com retry), sucesso (Toast).

## Acessibilidade (WCAG 2.1 AA)
- Contraste texto normal ≥ 4.5:1, texto grande/ícones ≥ 3:1, nos dois temas. Prioridade/status nunca só por cor (ícone + texto).
- Foco visível, navegação por teclado, `label` em todo input, `aria-*` em componentes customizados, alvos de toque ≥ 40px.
- Respeitar `prefers-reduced-motion`.

## Testes (Vitest)
- Hooks e utils: unitário. Telas: Testing Library com MSW simulando API. Teste comportamento (o que o usuário vê), não implementação.
- Cada formulário: teste de validação (limites 50–1000 chars, arquivos JPG/PNG ≤ 5 MB).
