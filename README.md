# AI-Based Student Policy Guidance System for Higher Institutions

**A Master's Research Project**  
Veritas University Abuja | Department of Computer and Information Technology

---

## � New Here? Start with [QUICK_START.md](./QUICK_START.md) →

📖 **For complete setup and orientation:** [QUICK_START.md](./QUICK_START.md)  
📊 **For current status and next steps:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## �📚 Research Context

This project is the technical implementation component of a Master of Science research titled **"Development of an AI-Based Student Policy Guidance System for Higher Institutions"** by Ediomo Titus (VPG/MSC/CSC/24/13314) under the supervision of Dr. Mustapha Aminu Bagiwa.

**See [RESEARCH_OVERVIEW.md](./RESEARCH_OVERVIEW.md) for complete research documentation.**

---

## 🎯 Project Overview

A TypeScript full-stack monorepo implementing an intelligent policy guidance system designed to address the critical gap between complex institutional policies and their practical accessibility in Nigerian higher education institutions.

## Tech Stack

### Backend

- Node.js + Express + TypeScript
- Clean/Hexagonal Architecture (Controllers → Services → Repositories)
- Zod for runtime validation
- Vitest + Supertest for testing

### Frontend

- React 18 + Vite + TypeScript
- Tailwind CSS for styling
- Shared types with backend via `@ai-student-policy/shared-types`
- Vitest for testing

### Monorepo

- npm workspaces
- Shared types package (`packages/shared-types`)
- ESLint + Prettier
- GitHub Actions CI

## 📖 Research Documentation

- **[Research Overview](./RESEARCH_OVERVIEW.md)** - Complete research proposal, objectives, and methodology
- **[Literature Review Summary](./docs/LITERATURE_REVIEW.md)** - Key findings from Chapter 2
- **[Methodology Implementation Guide](./docs/METHODOLOGY_IMPLEMENTATION.md)** - From research design to system development
- **[Development Roadmap](./ROADMAP.md)** - 40-week timeline with milestones and KPIs
- **[Project Status Report](./PROJECT_STATUS.md)** - ⭐ **Current progress tracker and next steps**
- **[Rebranding Notes](./REBRANDING.md)** - Project naming changes documentation

---

## 🚀 Quick Start

```
apps/
  backend/
    src/
      controllers/     # HTTP adapters
      services/        # Business logic
      repositories/    # Data access
      index.ts
  frontend/
    src/
      App.tsx
      main.tsx
packages/
  shared-types/       # Shared DTOs & Zod schemas
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Development

Run both apps concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Lint

```bash
npm run lint
```

## Docker

Run with Docker Compose:

```bash
docker-compose up
```

Build backend Docker image:

```bash
cd apps/backend
docker build -t ai-student-policy-backend .
```

## Deployment

### Frontend (Netlify)

- Configured in `netlify.toml`
- Build command: `npm run build --workspace=apps/frontend`
- Publish directory: `apps/frontend/dist`

### Backend

- Deploy as Docker container
- Supports: Heroku, Railway, DigitalOcean, AWS ECS, etc.
- Environment variables: `PORT`, `NODE_ENV`

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Contributing

1. Install dependencies: `npm install`
2. Create a feature branch
3. Make changes and add tests
4. Run `npm run lint` and `npm test`
5. Submit a pull request

## License

Public domain (specify your license here)
