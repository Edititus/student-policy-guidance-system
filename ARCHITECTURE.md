# AI-Based Student Policy Guidance - Project Documentation

## Architecture Overview

This is a TypeScript full-stack monorepo using **Clean/Hexagonal Architecture** principles.

### Structure

```
apps/
  frontend/          React + Vite + TypeScript + Tailwind CSS
  backend/           Node + Express + TypeScript
packages/
  shared-types/      Shared DTOs and Zod schemas
```

### Backend Architecture (Clean Architecture)

- **Controllers** (`src/controllers/`) — HTTP adapters, handle requests/responses, validate with Zod
- **Services** (`src/services/`) — Business logic, orchestrates use-cases
- **Repositories** (`src/repositories/`) — Data access layer (currently in-memory, extensible to DB)
- **Domain** (future) — Entities, value objects, domain errors

### Frontend Architecture

- **Component-based** — React functional components
- **Tailwind CSS** — Utility-first styling
- **Typed API** — Uses shared types from `@ai-student-policy/shared-types` with runtime validation (Zod)
- **State management** — React hooks (can add React Query for caching)

### Shared Types Package

- Centralized DTOs and validation schemas
- Backend and frontend both import from `@ai-student-policy/shared-types`
- Compile-time type safety + runtime validation

### Tech Stack

- **Backend:** Node.js, Express, TypeScript, Zod
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Testing:** Vitest (unit), Supertest (integration)
- **Linting:** ESLint + Prettier
- **CI/CD:** GitHub Actions
- **Deployment:** Netlify (frontend), containerized backend (Docker-ready)

### Development

Install dependencies:

```bash
npm install
```

Run both apps in dev mode:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

Build production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Lint:

```bash
npm run lint
```

### Deployment

- **Frontend:** Netlify (configured in `netlify.toml`)
- **Backend:** Deploy as container or to PaaS (Heroku, Railway, etc.)

### Next Steps (Roadmap)

- [ ] Add database (Prisma + PostgreSQL)
- [ ] Add authentication (JWT/OAuth)
- [ ] Add React Query for API state management
- [ ] Add Docker + docker-compose
- [ ] Add pre-commit hooks (Husky)
- [ ] Add OpenAPI/Swagger docs
- [ ] Add domain entities and value objects
- [ ] Add logging (winston/pino) and observability
- [ ] Add feature flags and environment configs
