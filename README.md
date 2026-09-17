# Bilingual News Management

A small news platform where every post exists in two languages — English and Russian — with authenticated publishing. A .NET 8 API on PostgreSQL and a React front end that switches language at runtime.

## What it does

- **Posts with per-language translations.** A post is one record (slug, status, author, featured image, view count) with a translation row per language — title, content, summary and SEO meta. The public site shows the translation for the reader's language; the admin edits both side by side.
- **Draft → published workflow** with a `PostStatus` on each post and a separate `PublishedAt`.
- **Accounts:** ASP.NET Identity with JWT access tokens and refresh tokens (rotate, revoke, logout). Roles `Admin`, `Editor`, `User` are seeded; write endpoints currently require any signed-in user.
- **Search** across translations, listing by author, lookup by slug.
- **Bilingual UI** via `react-i18next`, toggled from the layout.

## Stack

| Layer | |
|---|---|
| API | ASP.NET Core 8, EF Core, ASP.NET Identity, JWT bearer, FluentValidation, AutoMapper, Serilog, Swagger |
| Database | PostgreSQL 15 (Npgsql) |
| Front end | React 18 + TypeScript, Vite, Tailwind CSS, Radix UI, react-router, react-i18next |
| Runtime | Docker Compose (postgres + api + vite dev server) |

## Run it

### With Docker

```bash
docker compose up --build
```

- Front end: http://localhost:3000
- API: http://localhost:5000 — Swagger at http://localhost:5000/swagger

On first start the API creates the schema, seeds the three roles and an admin account:

```
admin@newsmanagement.com / Admin123!
```

### Without Docker

You need .NET 8 SDK, Node 18+ and a local PostgreSQL.

```bash
# API — reads backend/appsettings.Development.json
cd backend
dotnet run

# front end — Vite proxies /api to http://localhost:5000
cd frontend
npm install
npm run dev
```

## Configuration

`backend/appsettings.json` carries the shape only; values live in `appsettings.Development.json` for local runs and in environment variables everywhere else (`ConnectionStrings__DefaultConnection`, `JwtSettings__SecretKey`). Supported languages are set in `SupportedLanguages`.

## Layout

```
backend/
  Controllers/   AuthController, PostsController
  Models/        Post, PostTranslation, PostStatus, ApplicationUser, RefreshToken
  DTOs/          request / response shapes
  Services/      auth (tokens), posts (CRUD, search, translations)
  Data/          ApplicationDbContext
  Migrations/
frontend/
  src/pages/     HomePage (public), AdminPage (editor)
  src/services/  api, auth
  src/i18n.ts    UI strings, en / ru
docker-compose.yml
```

## API

```
POST /api/auth/register | login | refresh-token | revoke-token | change-password | logout
GET  /api/auth/validate | profile

GET    /api/posts                 list
GET    /api/posts/{id}
GET    /api/posts/slug/{slug}
GET    /api/posts/search?q=
GET    /api/posts/author/{authorId}
POST   /api/posts                 signed-in
PUT    /api/posts/{id}            signed-in
DELETE /api/posts/{id}            signed-in
```

## Not there yet

No automated tests; `EnsureCreated` is used instead of applying migrations on startup; the seeded roles are not yet enforced on the write endpoints. Those are the obvious next steps.
