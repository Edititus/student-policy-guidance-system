# Product Requirements Document (PRD)

## 1. Overview
The application is a multi-school, policy-driven AI system with backend and frontend components, leveraging modern frameworks and cloud-native architecture. It integrates AI (HuggingFace), vector search (pgvector), and secure user management.

## 2. Core Features
- Multi-school support: Each school operates independently with its own policies and users.
- Policy management: CRUD operations for policies, embedding models, and queries.
- AI-powered chat: Integrates HuggingFace for NLP tasks.
- Admin and authentication: Secure admin/user management, role-based access.
- Data uploads: Secure file handling for policy and interview data.

## 3. Architecture

### Backend
- **Node.js/TypeScript** (Express): Modular structure (controllers, services, repositories).
- **PostgreSQL** with pgvector: Stores embeddings and policy data.
- **Dockerized**: Containerized for deployment and local development.
- **REST API**: Exposes endpoints for frontend and external integrations.
- **Authentication**: JWT-based, with password hashing (bcrypt).
- **Role-based access control**: Admin, user, school roles.
- **Validation & Error Handling**: Centralized middleware for input validation and error responses.
- **Migrations**: SQL scripts for schema and vector setup.

### Frontend
- **React + Vite + TypeScript**: SPA with modular pages/components.
- **Tailwind CSS**: Modern, responsive UI.
- **API Layer**: Secure communication with backend.
- **Context & Hooks**: State management and reusable logic.

### Shared Types
- **TypeScript types**: Shared across backend and frontend for consistency.

### DevOps
- **Docker Compose**: Orchestrates backend, frontend, and database.
- **Netlify**: Frontend deployment.
- **PGAdmin**: Database management.

## 4. Security

- **Authentication**: JWT, password hashing, session expiration.
- **Authorization**: Role checks on sensitive endpoints.
- **Input Validation**: Prevents injection and malformed data.
- **File Uploads**: Sanitization, size limits, and storage isolation.
- **Database**: Parameterized queries, least privilege access.
- **Secrets Management**: Environment variables, never hard-coded.
- **AI Integration**: API keys stored securely, rate limiting.
- **CORS**: Configured to restrict origins.
- **HTTPS**: Enforced in production.

## 5. Standards & Best Practices

- **Modular codebase**: Separation of concerns (controllers, services, repositories).
- **Type safety**: End-to-end with TypeScript.
- **Error handling**: Centralized, user-friendly messages.
- **Testing**: Unit and integration tests for critical logic.
- **Documentation**: Architecture, API, and setup guides.
- **CI/CD**: Automated builds, tests, and deployments.

## 6. Compliance

- **GDPR-ready**: Data minimization, user consent, deletion.
- **Audit logs**: Track admin actions and sensitive changes.

## 7. Scalability

- **Stateless backend**: Horizontal scaling.
- **Database indexing**: Optimized for vector search and queries.
- **Cloud deployment**: Docker-ready for AWS/GCP/Azure.
