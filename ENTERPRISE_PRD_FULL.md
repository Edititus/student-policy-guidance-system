# Product Requirements Document (PRD)

## 1. Executive Overview

The AI-Based Student Policy Guidance System is a multi-school, enterprise-grade platform for automating policy Q&A, document management, and analytics in higher education. It leverages Retrieval-Augmented Generation (RAG), vector search, and rule-based reasoning to deliver accurate, explainable answers to student queries, with HITL (Human-in-the-Loop) escalation for low-confidence cases. The system is architected for scale, security, and extensibility, supporting multiple institutions, roles, and policy domains.

## 2. System Architecture

### High-Level System Diagram (Text)

- **Frontend (React + Vite + Tailwind + TypeScript)**
  - PolicyChatbot (student)
  - AdminDashboard (admin)
  - AuthProvider (context)
  - Responsive SPA, WCAG 2.1 AA
- **Backend (Node.js + Express + TypeScript)**
  - Controllers: Chat, Policy, Auth, Admin, School
  - Services: RAG, Embedding, PolicyParser, Admin, Analytics, ProcessingTracker
  - Repositories: Sequelize ORM (PostgreSQL + pgvector)
  - Middleware: JWT auth, RBAC, validation, error handling
- **Database**
  - PostgreSQL (primary)
  - pgvector extension (vector search)
  - Sequelize ORM
  - Tables: schools, users, policies, policy_embeddings, queries
- **DevOps**
  - Docker Compose (multi-container orchestration)
  - Netlify (frontend deployment)
  - PGAdmin (DB management)
  - CI/CD: GitHub Actions
- **External Integrations**
  - HuggingFace/OpenAI (AI models)
  - S3/Azure Blob (file storage, optional)
  - SendGrid (notifications, optional)

### Service Boundaries

- **Frontend:** SPA, stateless, API-driven, role-based routing
- **Backend:** Modular, stateless, RESTful, clean architecture (controllers → services → repositories)
- **Database:** Multi-tenant, persistent, indexed, scalable

### State Management

- **Frontend:** React Context, React Query (API caching), localStorage (session)
- **Backend:** Stateless, session via JWT, DB for persistent state

### Data Flow

- User → Frontend → REST API → Backend → DB/AI → Response → Frontend

## 3. User Roles & Permissions

### Roles

- Student
- Admin
- Super Admin

### Permission Boundaries

- **Student:** Chatbot access, view own queries, feedback
- **Admin:** Dashboard, policy management, query review, analytics, school-specific scope
- **Super Admin:** All admin features, cross-school management

### Authorization Checks

- JWT token required for all protected endpoints
- Middleware: `authenticateToken`, `requireAdmin`, `requireSuperAdmin`
- Role-based route guards (frontend + backend)
- School-based filtering for data isolation

### Middleware Logic

- Token verification (header: Authorization: Bearer)
- Role validation (deny access if insufficient)
- Input validation (Zod schemas)
- Error handling (centralized)

## 4. Feature Breakdown (Detailed Per Feature)

### 1. Policy Chatbot (Student)

- **Purpose:** Answer policy queries, cite sources, escalate low-confidence
- **User Types:** Student
- **Trigger:** Chat UI, POST /api/chat/query
- **Inputs:** Query text, student context (year, department, program)
- **Outputs:** Answer, confidence, sources, escalation flag
- **Side Effects:** Query logged, feedback option, escalation if needed
- **Backend:** ChatController, RAGService, EmbeddingService
- **Frontend:** PolicyChatbot.tsx, ChatMessage, SourceCitation, ConfidenceIndicator
- **DB:** queries, policy_embeddings
- **Edge Cases:** Ambiguous queries, missing context, AI errors, escalation
- **Missing Validations:** None (Zod + backend checks)

### 2. Admin Dashboard

- **Purpose:** Manage queries, policies, analytics, escalations
- **User Types:** Admin, Super Admin
- **Trigger:** Dashboard UI, protected routes
- **Inputs:** Filters, uploads, responses, bulk actions
- **Outputs:** Stats, query lists, policy lists, analytics, CSV exports
- **Side Effects:** Policy activation, response override, escalation resolution
- **Backend:** AdminControllerDb, AdminService, PolicyController
- **Frontend:** AdminDashboard.tsx, AdminDashboardRefactored.tsx, AnalyticsPage, PoliciesPage
- **DB:** policies, queries, users, schools
- **Edge Cases:** Cross-school data, bulk actions, file upload errors
- **Missing Validations:** File type/size, policy content (handled)

### 3. Authentication

- **Purpose:** Secure login/register, session management
- **User Types:** Student, Admin, Super Admin
- **Trigger:** Login/Register UI, POST /api/auth/login/register
- **Inputs:** Email, password, role, school info
- **Outputs:** JWT token, user profile
- **Side Effects:** Session persistence, role-based routing
- **Backend:** AuthControllerDb, AuthService
- **Frontend:** AuthProvider, LoginPage, ProtectedRoute
- **DB:** users, schools
- **Edge Cases:** Invalid credentials, inactive users, duplicate emails
- **Missing Validations:** None (Zod + backend checks)

### 4. Policy Management

- **Purpose:** Upload, activate, edit, delete policies
- **User Types:** Admin, Super Admin
- **Trigger:** Policy Management UI, API endpoints
- **Inputs:** Policy file, metadata, school info
- **Outputs:** Policy records, embeddings, processing status
- **Side Effects:** Background processing, vector indexing
- **Backend:** PolicyController, PolicyParserService, ProcessingTracker
- **Frontend:** PoliciesPage, Upload widget
- **DB:** policies, policy_embeddings
- **Edge Cases:** File parsing errors, duplicate policies, versioning
- **Missing Validations:** File type/size, content (handled)

### 5. Escalation Management

- **Purpose:** Review low-confidence queries, override responses
- **User Types:** Admin, Super Admin
- **Trigger:** Escalated Queries UI, API endpoints
- **Inputs:** Query ID, admin response
- **Outputs:** Updated query, admin notes
- **Side Effects:** Audit log, feedback loop
- **Backend:** AdminControllerDb, QueryModel
- **Frontend:** EscalatedQueriesPage
- **DB:** queries
- **Edge Cases:** Multiple escalations, conflicting overrides
- **Missing Validations:** Response content (handled)

### 6. Analytics & Reporting

- **Purpose:** Track query volume, confidence, satisfaction, export data
- **User Types:** Admin, Super Admin
- **Trigger:** Analytics UI, API endpoints
- **Inputs:** Filters (date, school, category)
- **Outputs:** Charts, CSV exports
- **Side Effects:** None
- **Backend:** AdminService, Analytics endpoints
- **Frontend:** AnalyticsPage, Export widget
- **DB:** queries, policies, users
- **Edge Cases:** Large data sets, export failures
- **Missing Validations:** None

## 5. API Specification

### Endpoint List

#### Public
- GET /api/hello
- GET /api/health

#### Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/verify
- POST /api/auth/logout
- POST /api/auth/change-password

#### Chat (Student)
- POST /api/chat/query
- GET /api/chat/stats
- POST /api/chat/feedback

#### Policy Management (Admin)
- POST /api/policies/upload
- GET /api/policies
- POST /api/policies/:id/activate

#### Admin Dashboard
- GET /api/admin/stats
- GET /api/admin/escalated-queries
- POST /api/admin/queries/:id/respond
- GET /api/admin/queries
- PATCH /api/admin/responses/:id/override
- GET /api/admin/analytics
- GET /api/admin/export
- POST /api/admin/policies/bulk-action
- POST /api/admin/notifications/broadcast
- GET /api/admin/users
- GET /api/admin/activity

#### School Management (Super Admin)
- GET /api/admin/schools

### Request/Response Structure

- All endpoints: JSON, wrapped in `{ success, message, data }`
- Pagination: `{ total, limit, offset, hasMore }`
- Auth: JWT in Authorization header
- Errors: `{ success: false, message, error }`, HTTP status codes

### Error Cases

- 400: Validation errors
- 401: Authentication required/invalid token
- 403: Forbidden (role/permission)
- 404: Not found
- 409: Conflict (duplicate)
- 500: Internal server error

### Authentication Requirements

- All /admin, /policies, /chat require JWT
- Role checks enforced via middleware

### Rate Limiting

- 100 req/min per IP (backend)
- Frontend: debounce, client-side rate limiting

## 6. Database Schema

### Tables

#### schools
- id (PK, VARCHAR)
- name (VARCHAR)
- domain (VARCHAR, UNIQUE)
- country (VARCHAR)
- type (ENUM)
- settings (JSONB)
- contact_email (VARCHAR)
- website (VARCHAR)
- active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)

#### users
- id (PK, SERIAL)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, bcrypt)
- name (VARCHAR)
- role (ENUM: student/admin/super_admin)
- school_id (FK → schools.id)
- school_name (VARCHAR)
- school_domain (VARCHAR)
- department, student_id, year (VARCHAR)
- active (BOOLEAN)
- last_login (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)

#### policies
- id (PK, SERIAL)
- policy_id (VARCHAR, UNIQUE)
- title (VARCHAR)
- content (TEXT)
- category (VARCHAR)
- school_id (FK → schools.id)
- school_name (VARCHAR)
- uploaded_by (FK → users.id)
- visibility (ENUM)
- version (VARCHAR)
- effective_date, expiry_date (DATE)
- tags (ARRAY)
- metadata (JSONB)
- active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)

#### policy_embeddings
- id (PK, SERIAL)
- policy_id (FK → policies.id)
- embedding (VECTOR)
- school_id (FK → schools.id)
- school_name (VARCHAR)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMP)

#### queries
- id (PK, SERIAL)
- query_id (VARCHAR, UNIQUE)
- query, answer (TEXT)
- confidence (FLOAT)
- requires_escalation (BOOLEAN)
- user_id (FK → users.id)
- school_id (FK → schools.id)
- student_context, sources, metadata (JSONB)
- response_time (INTEGER)
- created_at, updated_at (TIMESTAMP)

### Relationships

- School hasMany Users, Policies, Queries
- User belongsTo School, hasMany Queries
- Policy belongsTo School, User, hasMany Embeddings
- Embedding belongsTo Policy
- Query belongsTo User, School

### Constraints & Indexes

- Unique: email, domain, policy_id, query_id
- Foreign keys: school_id, user_id, policy_id
- Indexes: school_id, role, category, active, created_at

### Migration Logic

- Initial schema creation
- Seed data (schools, users)
- Vector extension setup (pgvector)
- Index creation for performance

### Scaling Limitations

- Vector DB: Pinecone/FAISS limits (1M vectors)
- PostgreSQL: Connection pooling, read replicas
- Policy corpus: Large documents may require sharding

## 7. Core Workflows

### Student Query Flow

1. Student logs in (JWT issued)
2. Enters query in chatbot
3. Frontend sends POST /api/chat/query with context
4. Backend validates input, checks auth
5. RAGService:
   - Embeds query
   - Semantic search (pgvector)
   - Retrieves top policy chunks
   - Passes context to AI model (HuggingFace/OpenAI)
   - Generates answer, confidence, sources
   - Escalates if confidence LOW
6. Response returned to frontend
7. Student views answer, sources, confidence
8. Option to submit feedback

### Admin Escalation Flow

1. Admin logs in (JWT)
2. Navigates to Escalated Queries tab
3. Views flagged queries
4. Reviews AI answer, adds override if needed
5. Response updated, audit log created

### Policy Upload Flow

1. Admin uploads policy document (PDF/DOCX/TXT)
2. Backend parses file, extracts text, metadata, rules
3. Embedding generated, stored in vector DB
4. Policy record created, status tracked
5. Processing status polled by frontend

### Analytics Flow

1. Admin views Analytics tab
2. Backend aggregates stats (confidence, categories, trends)
3. Charts rendered, CSV export available

## 8. State Management

- **Frontend:** React Context for user/session, React Query for API data, localStorage for token/user
- **Backend:** Stateless, session via JWT, persistent state in DB
- **Processing Jobs:** In-memory tracker for uploads, status polled by frontend

## 9. Non-Functional Requirements

### Performance

- Response time: <3s for 90% of queries
- Support 100+ concurrent users
- Uptime: 99% during business hours
- DB query time: <500ms
- Vector search: <1s for top-5 results

### Security

- HTTPS/TLS 1.3 for all API calls
- AES-256 encryption for data at rest
- JWT tokens (24h expiry), refresh rotation
- Password hashing (bcrypt, 10-12 rounds)
- RBAC enforced everywhere
- API rate limiting (100 req/min/IP)
- NDPR/GDPR compliance
- CORS restricted to frontend domain
- Input validation (Zod, backend)
- SQL injection prevention (parameterized queries)
- XSS protection (sanitized output)
- Secure secrets management (env vars)

### Logging & Observability

- Structured JSON logs
- Log levels (ERROR, WARN, INFO, DEBUG)
- Centralized log aggregation (ELK stack)
- Sentry for error tracking
- CloudWatch/Datadog for metrics
- PagerDuty alerts for critical failures

### Reliability

- MTBF: >720 hours
- MTTR: <1 hour
- Graceful degradation (show cached results if AI fails)
- User-friendly error messages
- Automatic retry for transient failures
- Daily backups, 30-day retention

### Usability

- WCAG 2.1 AA accessibility
- Mobile responsive
- Multi-language support (planned)
- Admins can update policies without developer help

### Maintainability

- TypeScript strict mode
- ESLint + Prettier
- Test coverage >80%
- Code review required for merges
- API docs (OpenAPI/Swagger)
- Architecture diagrams
- Inline code comments
- Modular architecture (Clean/Hexagonal)

### Scalability

- Stateless API servers (horizontal scaling)
- Docker containers for easy replication
- Read replicas for PostgreSQL
- Indexed queries
- Pinecone/FAISS sharding
- Redis cache for frequent queries
- CDN for static assets

## 10. Risks & Technical Debt

### Known Gaps

- Rule-based inference engine (Milestone 2.3) not fully implemented
- Policy corpus extraction/manual rule formalization pending
- Performance logging/metrics (Milestone 2.6) in progress
- Integration testing, load testing, security audit (Milestone 2.7) pending
- Multi-language support (planned)
- Mobile app (planned)
- Portal integration (planned)

### Hard-Coded Values

- JWT secret fallback in code (should be env only)
- Demo credentials in dev mode

### Missing Validation

- Policy content validation (edge cases)
- File upload: advanced virus scanning (not implemented)

### Security Risks

- First query slow (model warmup)
- Escalation rate higher with HuggingFace models
- OpenAI API cost risk for pilot scale

### Poor Abstractions

- ProcessingTracker: in-memory, not persistent
- Policy versioning: basic, needs improvement

### Tight Coupling

- Some service logic tightly coupled to controller layer
- School filtering logic duplicated in admin endpoints

## 11. Suggested Refactor Opportunities

- Move ProcessingTracker to persistent store (Redis)
- Abstract policy versioning and update tracking
- Refactor school filtering to reusable middleware
- Implement domain layer (entities, value objects)
- Add OpenAPI/Swagger docs for API
- Modularize analytics and logging services
- Enhance error handling for file uploads
- Add feature flags for experimental features

## 12. Expansion Readiness Analysis

- **Multi-school:** Fully supported, scalable to 100+ institutions
- **Policy domains:** Extensible, new categories can be added
- **User roles:** RBAC ready, can add supervisor/other roles
- **AI models:** Pluggable (OpenAI, HuggingFace, custom)
- **Database:** Indexed, scalable, vector search ready
- **Frontend:** Modular, accessible, mobile-ready
- **DevOps:** Dockerized, CI/CD, cloud deployment ready
- **Compliance:** NDPR/GDPR, audit logs, data deletion
- **Observability:** Logging, metrics, error tracking
- **Extensibility:** Clean architecture, shared types, modular codebase

---

# Claude Code Implementation Plan

## Phases & Milestones

### Phase 1: Foundation
- Monorepo setup, CI/CD, Docker, shared types
- Estimated complexity: Low
- Risk: Low

### Phase 2: Core Features
- Backend API, frontend SPA, authentication, policy management, chatbot, admin dashboard
- Estimated complexity: Medium-High
- Risk: Medium

### Phase 3: Advanced Features
- RAG pipeline, vector DB integration, rule-based inference, analytics, escalation
- Estimated complexity: High
- Risk: High

### Phase 4: Testing & Hardening
- Integration tests, load tests, security audit, accessibility
- Estimated complexity: Medium
- Risk: Medium

### Phase 5: Expansion
- Multi-language, mobile app, portal integration, advanced analytics
- Estimated complexity: High
- Risk: Medium-High

---

## Task Breakdown

- Setup DB schema & migrations
- Implement authentication (JWT, bcrypt)
- Build REST API (controllers, services, repositories)
- Develop frontend SPA (React, context, hooks)
- Integrate vector search (pgvector, Pinecone/FAISS)
- Implement RAG pipeline (LangChain, OpenAI/HuggingFace)
- Build admin dashboard (query review, policy management, analytics)
- Add escalation logic (HITL)
- Implement logging & metrics
- Add testing (unit, integration, load)
- Refactor for modularity, maintainability
- Document API, architecture, workflows

---

## Estimated Complexity per Module

- Auth: Medium
- Policy Management: Medium
- Chatbot/RAG: High
- Admin Dashboard: High
- Analytics: Medium
- Rule Engine: High
- DB Integration: Medium
- Testing: Medium
- DevOps: Low-Medium

---

## Risk Rating per Task

- RAG/AI integration: High (model accuracy, cost)
- Rule extraction: High (manual, LLM-assisted)
- DB scaling: Medium (vector limits)
- Security: Medium (audit, compliance)
- UI accessibility: Low-Medium
- Multi-school: Medium
- Analytics: Medium

---

Let me know if you want this PRD saved, or need a breakdown for a specific module or workflow.
