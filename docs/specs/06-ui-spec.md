# SPEC-06 — UI/UX
Status: ready · Regras de código em `.claude/rules/03-frontend.md`

## Paleta (tokens shadcn, a paleta do enunciado veio vazia — definida aqui; validar contraste no build)
| Token | Light | Dark |
|---|---|---|
| background | `#F8FAFC` | `#0B1020` |
| foreground | `#0F172A` | `#E5E7EB` |
| card | `#FFFFFF` | `#121A2F` |
| muted-foreground | `#475569` | `#9CA3AF` |
| border | `#E2E8F0` | `#243049` |
| primary | `#4F46E5` | `#818CF8` |
| primary-foreground | `#FFFFFF` | `#0B1020` |
| accent (destaque secundário, teal) | `#0F766E` | `#2DD4BF` |
| destructive | `#B91C1C` | `#F87171` |
| ring | `#4F46E5` | `#A5B4FC` |
| success | `#15803D` | `#4ADE80` |
| warning | `#B45309` | `#FBBF24` |

### Semântica
| Item | Cor | Complemento obrigatório (não só cor) |
|---|---|---|
| Prioridade Alta | destructive | ícone `ChevronsUp` + texto |
| Prioridade Média | warning | ícone `Equal` + texto |
| Prioridade Baixa | success | ícone `ChevronDown` + texto |
| Não classificada | muted | texto "Sem prioridade" |
| Status OPEN | primary | texto "Aberta" |
| Status IN_PROGRESS | warning | texto "Em resolução" |
| Status RESOLVED | success | texto "Finalizada" |

Fonte: Inter (fallback system-ui). Raio base `0.75rem`. Espaçamento múltiplos de 4px.

## Telas
| ID | Tela | Role | Conteúdo |
|---|---|---|---|
| UI-01 | Login / Cadastro (abas) | público | Logo, formulário com validação da política de senha |
| UI-02 | Dashboard Admin | ADMIN | KPIs (total, abertas, em resolução, finalizadas, alta prioridade) → gráfico por status/categoria → tabela de solicitações com lista suspensa de prioridade por linha (exceto finalizadas) (ordenar data/prioridade, filtros, paginação) |
| UI-03 | Detalhe/Tratamento (página) | ADMIN | Dados, anexos (galeria), select de status e observação. Botão "Finalizar solicitação" em cor de destaque (`accent`) no canto superior direito, visível só quando o status é "Em resolução"; abre um modal de confirmação com a resolução (obrigatória). Prioridade não é editada aqui (fica na tabela da UI-02) |
| UI-04 | Categorias | ADMIN | Lista de todas (ativas e inativas, com badge "Ativa"/"Inativa") + criar categoria (Dialog) + ação "Desativar" com confirmação (AlertDialog) nas ativas |
| UI-05 | Usuários | ADMIN | Criar usuário/admin (Dialog) |
| UI-06 | Dashboard User | USER | KPIs próprios → lista das suas solicitações (somente leitura) |
| UI-07 | Nova solicitação | USER | Título, categoria, descrição (contador 0/1000, mínimo 50), upload múltiplo com preview, valida JPG/PNG ≤ 5 MB |
| UI-08 | Detalhe da solicitação (leitura) | USER | Status, prioridade, observação e resolução do admin, anexos |
| UI-09 | 404 / Sem permissão | todos | Mensagem + ação voltar |

## Formulários
- Validação a cada digitação (React Hook Form `mode: 'onChange'`) com o mesmo schema zod do envio (RN-13); o erro some assim que o valor fica válido.
- Mensagem abaixo do campo, ligada por `aria-describedby`, com `aria-invalid` no campo; erros da API continuam no topo do formulário (`role="alert"`).
- Selects de categoria (Nova solicitação, filtro do painel admin) listam só categorias ativas (RF-15).

## Hover discreto
- A cor de destaque (`accent`) é reservada a ações em destaque (ex.: "Finalizar solicitação"); nunca é usada como hover/foco nem como fundo de carregamento.
- Itens de Select e DropdownMenu, botões `ghost`/`outline`, badges-link e o botão de fechar do Dialog usam hover/foco discreto (`bg-muted`, texto `foreground`).
- Skeleton (carregamento) usa `bg-muted`.

## Galeria de anexos (UI-03, UI-08)
- Miniaturas clicáveis (botão acessível "Ampliar <nome> (<tamanho>)"). O clique abre um modal (Dialog) **na mesma página** com a imagem ampliada, nome e tamanho.
- O modal fecha pelo botão "Fechar", por `Esc` ou clicando fora; o foco volta à miniatura.

## Layout
Sidebar colapsável (drawer no mobile) + topbar com toggle de tema e menu do usuário. Grid de KPIs `1/2/4` colunas; tabela com scroll-x no mobile e linha clicável com foco por teclado.

## Componentes shadcn previstos
Button, Input, Textarea, Label, Form, Select, Card, Badge, Table, Dialog, Sheet, Tabs, DropdownMenu, Toast (Sonner), Skeleton, Tooltip, Pagination, Avatar, Separator.

## Logo
`assets/logo.svg` (horizontal, adapta ao tema) e `assets/logo-icon.svg` (favicon/sidebar colapsada).
