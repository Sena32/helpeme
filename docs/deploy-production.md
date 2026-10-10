# Deploy em produção — MongoDB Atlas + Render (backend) + Vercel (frontend)

Guia para publicar o HelpeMe fora do Docker Compose. A execução local (`docker compose up --build` e o modo Node descrito no README) **não muda**: nada aqui altera arquivos usados localmente; os valores abaixo são configurados nos painéis de cada serviço.

## Arquitetura

```
Navegador ──HTTPS──> Vercel (frontend estático, Vite build)
                       │  /api/*  (rewrite = proxy reverso)
                       └──────────> Render (backend NestJS) ──> MongoDB Atlas
```

O navegador só conversa com o domínio da Vercel. As chamadas `/api/*` são repassadas pela Vercel ao Render, como o nginx faz no Docker. Isso mantém a **mesma origem**, então o cookie de sessão `httpOnly`/`SameSite=Lax` continua funcionando sem CORS e sem mudança de código.

## 1. MongoDB Atlas

1. Crie um projeto e um cluster (o tier gratuito M0 atende para avaliação).
2. **Database Access** → crie um usuário com senha forte e papel `readWrite` no banco `helpeme`.
3. **Network Access** → libere o acesso do Render:
   - Recomendado: os IPs de saída do serviço, listados no painel do Render (**Connect → Outbound**).
   - Alternativa: `0.0.0.0/0`, aceitável só com usuário restrito e senha forte.
4. **Connect → Drivers** → copie a connection string e acrescente o nome do banco:

   ```
   mongodb+srv://ailtonsenap_db_user:VHKpx3EsUjjY0Gxi@cluster0.ixkmsmt.mongodb.net/?appName=Cluster0
   ```

   Se a senha tiver caracteres especiais (`@ : / ? # %`), use-a codificada em URL.

Não é preciso criar índices manualmente. Em produção o Mongoose não cria índices sozinho (`autoIndex` desligado), mas o backend os cria explicitamente na inicialização, antes do seed.

## 2. Backend no Render

Crie um **Web Service** apontando para o repositório, com runtime **Node**:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci --include=dev && npm run build && npm prune --omit=dev` |
| Start Command | `node dist/main.js` |
| Health Check Path | `/api/health` |

O `--include=dev` é necessário porque, com `NODE_ENV=production`, o `npm ci` pularia as dependências de desenvolvimento usadas no build (Nest CLI e TypeScript). O `prune` remove essas dependências depois.

### Variáveis de ambiente (Render → Environment)

| Variável | Valor em produção |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `BACKEND_PORT` | `10000`: a mesma porta do `PORT` do Render (padrão `10000`); o app escuta em `BACKEND_PORT` |
| `MONGODB_URI` | a connection string do Atlas (passo 1) |
| `JWT_SECRET` | valor longo e aleatório, por exemplo `openssl rand -hex 48` |
| `JWT_EXPIRES_IN` | `1h` (ou o que preferir) |
| `COOKIE_SECURE` | `true` (tudo é HTTPS) |
| `BCRYPT_ROUNDS` | `12` |
| `CORS_ORIGIN` | a URL da Vercel, por exemplo `https://helpeme.vercel.app` (validada no boot; o fluxo usa a mesma origem) |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | `60` / `10` (veja a limitação abaixo) |
| `RUN_SEED` | `true` (idempotente; cria admin root e categorias padrão) |
| `ADMIN_ROOT_NAME` | nome do admin |
| `ADMIN_ROOT_EMAIL` | e-mail real do admin |
| `ADMIN_ROOT_PASSWORD` | senha forte (≥ 8, maiúscula, minúscula, número e especial). **Não use a do `.env.example`** |
| `UPLOAD_DIR` | `/var/data/uploads` |
| `MAX_UPLOAD_SIZE_MB` / `MAX_FILES_PER_REQUEST` | `5` / `5` |
| `PAGINATION_MAX_LIMIT` | `50` |
| `LOG_LEVEL` | `info` |

Não defina `SEED_USER_*` em produção. Elas servem só para criar o usuário de teste e são opcionais.

### Anexos (disco persistente)

O filesystem do Render é **efêmero**: sem disco, os anexos somem a cada deploy ou reinício. Para mantê-los, adicione um **Persistent Disk** com mount path `/var/data`; o `UPLOAD_DIR` acima já aponta para dentro dele. Pela documentação do Render:

- disco só está disponível em instâncias **pagas**;
- com disco, o serviço fica limitado a **uma instância**;
- deploys deixam de ser *zero-downtime*.

No plano gratuito o sistema funciona, mas os anexos não persistem e o serviço "dorme" após inatividade (a primeira requisição demora). Para persistência sem essas limitações, o caminho previsto na arquitetura (ADR-3) é trocar o armazenamento em disco por um object storage (S3 ou compatível), implementando a interface `AttachmentStorage`.

## 3. Frontend na Vercel

Crie um projeto importando o repositório:

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_BASE_URL=/api` (Production e Preview) |

Crie `frontend/vercel.json` com o proxy da API e o fallback da SPA, trocando a URL pela do seu serviço no Render. Esse arquivo só é lido pela Vercel e não afeta a execução local.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://SEU-SERVICO.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [{ "key": "x-vercel-enable-rewrite-caching", "value": "0" }]
    }
  ]
}
```

- **Ordem:** a regra de `/api` vem antes do fallback.
- **Sem cache na API:** o header desativa o cache da Vercel nas respostas da API, que são autenticadas e não devem ser cacheadas.
- **IP do visitante:** a Vercel repassa ao Render os headers `x-forwarded-for` e `x-real-ip`.
- **Timeout:** o proxy da Vercel tem timeout de 120 s por requisição.

## 4. Primeiro deploy e verificação

1. Publique o backend e espere o health check (`/api/health`) ficar verde.
2. Publique o frontend.
3. Abra `https://<seu-projeto>.vercel.app`, entre com o admin root e confira as 5 categorias padrão.
4. Teste o fluxo completo: crie um usuário, abra uma solicitação **com anexo de até 5 MB**, trate-a e finalize-a como admin.
5. Rode o smoke ponta a ponta contra a URL pública. Ele lê o `.env` local, então use um `.env` temporário com `ADMIN_ROOT_EMAIL`/`ADMIN_ROOT_PASSWORD` iguais aos de produção e **sem** `SEED_USER_*` (o usuário de teste não existe em produção):

   ```bash
   SMOKE_BASE_URL=https://<seu-projeto>.vercel.app node --test tests/smoke/smoke.test.mjs
   ```

   O smoke cria usuários e uma solicitação de teste; rode-o só em ambientes de avaliação.

## Limitações conhecidas e ajustes recomendados antes de produção real

- **Rate limit atrás de proxies:** o backend ainda não configura `trust proxy` do Express. Atrás da Vercel e do Render, o IP visto pelo app é o do proxy, então o limite de login/cadastro (`THROTTLE_LIMIT`) passa a ser compartilhado por todos os usuários. Ajuste recomendado: habilitar `trust proxy` para os saltos conhecidos e usar o IP real do `X-Forwarded-For`.
- **Tamanho de upload pelo proxy:** não encontrei, na documentação da Vercel consultada, um limite de corpo para rewrites externos; o limite documentado é o timeout de 120 s. Uma solicitação pode ter até 25 MB (5 × 5 MB), então valide no passo 4 com arquivos grandes. Se houver bloqueio, a alternativa é expor a API em um subdomínio do mesmo site (ex.: `api.seudominio.com`) com CORS habilitado no backend usando `CORS_ORIGIN`, o que exige pequena mudança de código.
- **Hardening HTTP:** cabeçalhos de segurança (Helmet) ainda não estão habilitados no backend.
- **Segredos:** guarde `JWT_SECRET`, `MONGODB_URI` e `ADMIN_ROOT_PASSWORD` apenas nos painéis do Render e da Vercel; nunca no repositório.
