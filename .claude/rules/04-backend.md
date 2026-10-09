---
paths:
  - "backend/**"
---

# Backend — Node.js + NestJS + TypeScript

## Stack
NestJS, TypeScript `strict`, Mongoose (`@nestjs/mongoose`), `class-validator`/`class-transformer` (DTOs), `@nestjs/config` + validação de env, `@nestjs/jwt`, bcrypt, Multer (upload), `nestjs-pino` (log estruturado), Swagger (`@nestjs/swagger`). Testes: Jest + Supertest + `mongodb-memory-server` (TDD, ver `02-tdd.md`).

## Arquitetura em camadas (por módulo)
```
src/modules/<feature>/
  <feature>.controller.ts   # HTTP only: valida DTO, chama service, devolve resposta
  <feature>.service.ts      # regras de negócio (sem acesso direto ao Mongoose)
  <feature>.repository.ts   # único ponto de acesso ao banco
  schemas/<feature>.model.ts# model/schema Mongoose
  dto/                      # DTOs de entrada/saída
  <feature>.module.ts
src/common/  # guards, decorators, filters, interceptors, middlewares, pipes
src/config/  # env schema tipado
src/database/seeds/  # seed idempotente
```
- Controller → Service → Repository → Model. Camadas não pulam níveis.
- Controllers não têm regra de negócio; services não conhecem `Request`/`Response`.
- Injeção de dependência sempre; repositórios injetados nos services (facilita mock em TDD).

## Tipagem
- **Proibido `any`** (lint `@typescript-eslint/no-explicit-any: error`). Use `unknown`, generics, tipos utilitários e interfaces de domínio.
- Retorno de endpoints via DTO/serializer; nunca expor `passwordHash` ou campos internos.

## Middlewares / pipeline
- **Autenticação**: `JwtAuthGuard` global (rotas públicas marcadas com `@Public()`).
- **Roles**: `RolesGuard` + `@Roles(Role.Admin)`; checagem de propriedade (user só acessa suas solicitações) no service.
- **Log estruturado**: middleware/interceptor com `pino` (JSON) registrando `requestId`, método, rota, status, latência, `userId`. Redigir `authorization`, `password`, cookies.
- `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`). Filtro global de exceções com formato único de erro `{ statusCode, error, message, requestId }`.
- Helmet, CORS restrito por env (`CORS_ORIGIN`), rate limit (`@nestjs/throttler`) em login/register.

## Upload
- Multer com storage em disco (`UPLOAD_DIR` via env), limite `MAX_UPLOAD_SIZE_MB` e `MAX_FILES_PER_REQUEST`.
- Validar MIME **e** assinatura (magic bytes) JPG/PNG; nome gerado por UUID; nunca usar o nome original no disco; servir somente via endpoint autenticado com checagem de propriedade.

## Senhas, seed e erros
- Política de senha: ≥ 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial (padrão do admin root).
- Seed idempotente (`upsert`) lê `ADMIN_ROOT_NAME/EMAIL/PASSWORD` do env e cria categorias padrão; roda no bootstrap quando `RUN_SEED=true`.
- Use exceções HTTP do Nest (`NotFoundException`, `ForbiddenException`…); mensagens em pt-BR, sem vazar detalhes internos.
- Respostas 401 genéricas no login (não revelar se o e-mail existe).
