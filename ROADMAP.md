# Project Roadmap

## Development Roadmap for AI-Based Student Policy Guidance System

Based on the research methodology (Chapter 3), this roadmap outlines the development phases aligned with the Design Science Research (DSR) paradigm.

---

## Current Status: Artifact Development Phase (In Progress)

### ✅ Completed (Foundation)

- [x] Monorepo scaffolding (npm workspaces)
- [x] Backend API structure (Node.js + Express + TypeScript)
- [x] Frontend UI foundation (React + Vite + Tailwind CSS)
- [x] Shared types package with Zod validation
- [x] Clean Architecture pattern (Controllers, Services, Repositories)
- [x] Testing framework (Vitest + Supertest)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization
- [x] ESLint + Prettier configuration
- [x] Project documentation structure

---

## Phase 1: Problem-Centered Design (Qualitative Research)

### Objectives
- Understand problem space through stakeholder interviews
- Analyze institutional policy documents
- Define system requirements

### Tasks

#### 1.1 Data Collection (Weeks 1-3)
- [ ] **Stakeholder Interviews**
  - [ ] Interview 10-15 administrative staff
  - [ ] Interview 15-20 students with recent policy experiences
  - [ ] Record and transcribe all interviews
  
- [ ] **Document Collection**
  - [ ] Gather policy handbooks from 2 partner universities
  - [ ] Collect academic regulations and senate bulletins
  - [ ] Organize documents by policy category

#### 1.2 Data Analysis (Weeks 4-6)
- [ ] **Thematic Analysis**
  - [ ] Code interview transcripts
  - [ ] Identify key pain points and themes
  - [ ] Map user needs and expectations
  
- [ ] **Policy Document Analysis**
  - [ ] Extract policy entities (Student, Course, Appeal, etc.)
  - [ ] Identify rules, conditions, and exceptions
  - [ ] Map policy dependencies and workflows
  - [ ] Document ambiguities and edge cases

#### 1.3 Requirements Specification (Week 6)
- [ ] Create functional requirements document
- [ ] Define non-functional requirements (performance, security)
- [ ] Develop user personas (students, administrators)
- [ ] Design conceptual data model
- [ ] Prioritize features for MVP

**Deliverables:**
- Requirements Specification Document
- Policy Analysis Report
- Conceptual Data Model
- User Personas and Journey Maps

---

## Phase 2: Artifact Development (Technical Implementation)

### Objectives
- Build AI-based policy guidance system
- Implement rule-based reasoning + NLP
- Create user interfaces for students and admins

### Milestone 2.1: Knowledge Base and Data Pipeline (Weeks 7-10)

#### Backend: Policy Management System
- [ ] **Policy Document Parser**
  - [ ] PDF/DOCX to structured JSON converter
  - [ ] Policy categorization engine
  - [ ] Rule extraction algorithm
  
- [ ] **Embedding Service**
  - [ ] Integrate OpenAI Embeddings API or Sentence-BERT
  - [ ] Generate vector embeddings for policy chunks
  - [ ] Implement batch processing for large documents
  
- [ ] **Vector Database Setup**
  - [ ] Configure Pinecone or FAISS
  - [ ] Design indexing strategy
  - [ ] Implement CRUD operations for embeddings
  
- [ ] **Knowledge Base Models**
  ```typescript
  // apps/backend/src/models/
  - Policy.ts
  - PolicyRule.ts
  - PolicyCategory.ts
  - PolicyEmbedding.ts
  ```

**Deliverables:**
- Policy ingestion pipeline
- Vector database with initial policy embeddings
- API endpoints for knowledge base management

---

### Milestone 2.2: AI & Retrieval Module (RAG Pipeline) (Weeks 11-14)

#### Backend: Intelligent Query Processing
- [ ] **NLP Module**
  - [ ] Intent classification (registration, deferment, appeals, etc.)
  - [ ] Entity extraction (course codes, GPAs, dates)
  - [ ] Query preprocessing and normalization
  
- [ ] **RAG Pipeline Integration**
  - [ ] Set up LangChain or Haystack
  - [ ] Implement semantic search over policy vectors
  - [ ] Configure retrieval parameters (top-k, similarity threshold)
  
- [ ] **LLM Integration**
  - [ ] Connect to OpenAI GPT API or Hugging Face model
  - [ ] Design prompts for policy Q&A
  - [ ] Implement context window management
  - [ ] Add response streaming
  
- [ ] **Response Generation**
  - [ ] Synthesize answers from retrieved policies
  - [ ] Generate source citations
  - [ ] Calculate confidence scores
  - [ ] Implement explainability features

**Technical Stack:**
- LangChain / Haystack for RAG orchestration
- OpenAI GPT-4 or GPT-3.5-turbo for generation
- Text-embedding-ada-002 for embeddings
- Redis for caching

**Deliverables:**
- Functional RAG pipeline
- API endpoints for policy queries
- Unit tests for NLP and retrieval modules

---

### Milestone 2.3: Rule-Based Inference Engine (Weeks 15-17)

#### Backend: Policy Logic and Reasoning
- [ ] **Rule Formalization**
  - [ ] Convert policy rules to IF-THEN format
  - [ ] Define rule priority and precedence
  - [ ] Model exceptions and edge cases
  
- [ ] **Inference Engine**
  - [ ] Implement forward-chaining algorithm
  - [ ] Build rule evaluation engine
  - [ ] Add conflict resolution logic
  
- [ ] **Context Integration**
  - [ ] Define student context schema
  - [ ] Integrate with student records (mock data for pilot)
  - [ ] Implement personalized rule application
  
- [ ] **Explainability Module**
  - [ ] Generate reasoning chains
  - [ ] Map decisions to specific policy clauses
  - [ ] Create human-readable explanations

**Models to Implement:**
```typescript
// apps/backend/src/services/
- inferenceEngine.ts
- ruleEngine.ts
- explainabilityService.ts
```

**Deliverables:**
- Rule-based inference engine
- Explainability API
- Integration tests with RAG pipeline

---

### Milestone 2.4: Frontend Chat Interface (Weeks 18-20)

#### Frontend: Student-Facing Application
- [ ] **Chat UI Components**
  - [ ] Message bubbles (user, AI, system)
  - [ ] Input field with text/voice options
  - [ ] Chat history sidebar
  - [ ] Loading states and animations
  
- [ ] **Policy Response Display**
  - [ ] Formatted answer rendering
  - [ ] Source citation cards with links
  - [ ] Confidence indicator (color-coded)
  - [ ] Expand/collapse for detailed explanations
  
- [ ] **Interactive Features**
  - [ ] Follow-up question suggestions
  - [ ] Feedback buttons (thumbs up/down)
  - [ ] Copy answer to clipboard
  - [ ] Share feature
  
- [ ] **Accessibility**
  - [ ] WCAG 2.1 AA compliance
  - [ ] Screen reader support
  - [ ] Keyboard navigation
  - [ ] High contrast mode

**Components:**
```typescript
// apps/frontend/src/components/
- PolicyChatbot.tsx
- ChatMessage.tsx
- SourceCitation.tsx
- ConfidenceIndicator.tsx
- FeedbackWidget.tsx
```

**State Management:**
- React Context or Zustand for chat state
- React Query for API calls and caching

**Deliverables:**
- Functional chat interface
- Responsive design (mobile + desktop)
- User acceptance testing (UAT) with 5-10 test users

---

### Milestone 2.5: HITL Administrator Dashboard (Weeks 21-24)

#### Frontend: Admin-Facing Application
- [ ] **Query Review Interface**
  - [ ] Table view of all student queries
  - [ ] Filter by date, category, confidence
  - [ ] Search functionality
  
- [ ] **Response Override**
  - [ ] View AI-generated responses
  - [ ] Edit or override answers
  - [ ] Add clarifications or notes
  
- [ ] **Knowledge Base Management**
  - [ ] Upload new policy documents
  - [ ] Edit existing policy rules
  - [ ] Archive outdated policies
  - [ ] Trigger re-embedding pipeline
  
- [ ] **Escalation Queue**
  - [ ] View queries flagged for human review
  - [ ] Assign to staff members
  - [ ] Track resolution status
  
- [ ] **Analytics Dashboard**
  - [ ] Query volume over time
  - [ ] Top policy categories
  - [ ] Average confidence scores
  - [ ] User satisfaction trends
  - [ ] Response time metrics

**Tech Stack:**
- Chart.js or Recharts for visualizations
- React Table for data tables
- Role-based access control (RBAC)

**Deliverables:**
- Admin dashboard MVP
- User guide for administrators
- Staff training materials

---

### Milestone 2.6: Performance Logging & Metrics (Weeks 23-24)

#### Backend: Monitoring and Analytics
- [ ] **Logging Service**
  - [ ] Query logging (timestamp, user, query, response)
  - [ ] Performance metrics (response time, accuracy)
  - [ ] User feedback tracking
  - [ ] Error logging
  
- [ ] **Analytics API**
  - [ ] Aggregate metrics endpoints
  - [ ] Real-time performance monitoring
  - [ ] Export reports (CSV, PDF)

```typescript
// apps/backend/src/services/metricsService.ts
export interface QueryMetrics {
  queryId: string
  timestamp: Date
  responseTime: number
  accuracy: number
  userRating: number
  escalated: boolean
}
```

**Deliverables:**
- Logging infrastructure
- Analytics API
- Admin dashboard integration

---

### Milestone 2.7: Integration & System Testing (Weeks 25-26)

- [ ] **End-to-End Testing**
  - [ ] Test complete user workflows
  - [ ] Verify RAG + Inference integration
  - [ ] Test escalation pathways
  
- [ ] **Load Testing**
  - [ ] Simulate 100+ concurrent users
  - [ ] Identify bottlenecks
  - [ ] Optimize performance
  
- [ ] **Security Audit**
  - [ ] Input validation
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] HTTPS enforcement
  
- [ ] **Accessibility Testing**
  - [ ] Screen reader compatibility
  - [ ] Keyboard navigation
  - [ ] Color contrast validation

**Deliverables:**
- Test report with coverage metrics
- Performance optimization report
- Security audit report
- System ready for pilot deployment

---

## Phase 3: Evaluation (Pilot Deployment & Assessment)

### Objectives
- Deploy system in 2 pilot universities
- Collect performance and user feedback data
- Assess institutional impact

### Milestone 3.1: Pilot Preparation (Weeks 27-28)

- [ ] **Institutional Setup**
  - [ ] Finalize MoU with partner universities
  - [ ] Set up deployment infrastructure
  - [ ] Configure for institutional branding
  
- [ ] **User Onboarding**
  - [ ] Create user guides (students, admins)
  - [ ] Conduct training sessions for staff
  - [ ] Set up support channels
  
- [ ] **Data Collection Instruments**
  - [ ] Finalize post-interaction survey
  - [ ] Prepare focus group discussion guides
  - [ ] Configure performance logging

**Deliverables:**
- Pilot deployment plan
- Training materials
- Evaluation instruments

---

### Milestone 3.2: Live Pilot Deployment (Weeks 29-32)

**Duration:** 4-6 weeks  
**Participants:**
- 150-200 students (stratified sample)
- 10-15 administrative staff

**Activities:**
- [ ] System goes live in pilot departments
- [ ] Continuous monitoring and support
- [ ] Weekly check-ins with stakeholders
- [ ] Bug fixes and minor improvements
- [ ] Data collection (automated + manual)

**Data Collected:**
- Query logs and performance metrics
- User surveys (post-interaction)
- Usage analytics
- Admin feedback

---

### Milestone 3.3: Data Analysis & Reporting (Weeks 33-34)

#### Quantitative Analysis
- [ ] Calculate system performance metrics
  - Average response time
  - Accuracy rate (validated by experts)
  - Escalation rate
  - User satisfaction scores
  
- [ ] Statistical analysis (SPSS/Python)
  - Descriptive statistics
  - Correlation analysis (satisfaction vs. performance)
  - Comparative analysis (AI vs. traditional methods)

#### Qualitative Analysis
- [ ] Conduct focus groups
  - 3-4 student focus groups
  - 2-3 staff focus groups
  
- [ ] Thematic analysis
  - Code focus group transcripts
  - Identify key themes (benefits, challenges, suggestions)
  
- [ ] Triangulation
  - Integrate quantitative and qualitative findings
  - Explain patterns and anomalies

**Deliverables:**
- Evaluation Report
- Statistical Analysis Report
- Focus Group Summary
- Lessons Learned Document

---

### Milestone 3.4: Thesis Writing & Defense (Weeks 35-40)

- [ ] Draft research chapters
  - Chapter 4: Results and Findings
  - Chapter 5: Discussion, Conclusions, Recommendations
  
- [ ] Prepare defense presentation
- [ ] Submit thesis draft to supervisor
- [ ] Incorporate feedback
- [ ] Final submission
- [ ] Thesis defense

**Deliverables:**
- Complete MSc Thesis
- Defense Presentation
- Journal publication draft (optional)

---

## Post-Research: Scale-Up and Sustainability (Future Work)

### Immediate Next Steps (After Successful Defense)
- [ ] Expand pilot to more departments
- [ ] Integrate with student information systems
- [ ] Add support for postgraduate policies
- [ ] Implement mobile app (React Native)
- [ ] Multilingual support (English + local languages)

### Long-Term Vision
- [ ] Nationwide deployment across Nigerian HEIs
- [ ] API for third-party integrations
- [ ] Policy analytics for institutional governance
- [ ] Predictive analytics (identify policy gaps)
- [ ] Open-source community version

---

## Risk Management

### Technical Risks
| Risk | Mitigation Strategy |
|------|---------------------|
| LLM API costs exceed budget | Use open-source models (Llama, Mistral) + local hosting |
| Low accuracy in policy interpretation | Iterative testing with expert validation; hybrid approach |
| Slow response times | Implement caching, optimize embeddings, use CDN |
| Vector DB performance issues | Start with FAISS (local), migrate to Pinecone if needed |

### Research Risks
| Risk | Mitigation Strategy |
|------|---------------------|
| Low user adoption during pilot | Intensive onboarding, incentives (certificates), staff champions |
| Resistance from administrators | HITL design, transparency about tool as support not replacement |
| Insufficient policy documents | Work with institutions to digitize policies collaboratively |
| Ethical concerns (privacy, bias) | Ethics approval, anonymization, bias testing, disclaimers |

### Timeline Risks
| Risk | Mitigation Strategy |
|------|---------------------|
| Development delays | Agile sprints, MVP focus, cut non-essential features |
| Institutional approval delays | Start paperwork early, maintain regular communication |
| Low pilot participation | Over-recruit participants, provide incentives |

---

## Success Metrics (KPIs)

### Technical Performance
- ✅ System accuracy: **> 85%** (vs. human expert baseline)
- ✅ Average response time: **< 3 seconds**
- ✅ System uptime during pilot: **> 99%**
- ✅ Escalation rate: **< 20%**

### User Acceptance
- ✅ User satisfaction (TAM survey): **> 4.0/5.0**
- ✅ Percentage of users willing to recommend: **> 70%**
- ✅ Perceived time savings: **> 75%** report improvement

### Institutional Impact
- ✅ Reduction in staff policy inquiry workload: **measurable decrease**
- ✅ Consistency in policy interpretation: **qualitative evidence**
- ✅ Institutional willingness to adopt: **positive feedback from leadership**

---

## Resource Requirements

### Human Resources
- **Researcher/Developer:** Full-time (you)
- **Supervisor:** Regular consultation
- **Domain Experts:** 3-4 for validation (policy officers, IT staff)
- **Pilot Participants:** 150-200 students, 10-15 staff

### Technical Resources
- **Cloud Infrastructure:** AWS/GCP/Azure (~$200-500/month for pilot)
- **OpenAI API Credits:** ~$100-300/month (or use open-source models)
- **Vector Database:** Pinecone free tier or FAISS (self-hosted)
- **Development Tools:** VS Code, Postman, GitHub (free)
- **Analytics:** Google Analytics (free), Mixpanel (free tier)

### Budget Estimate
- Cloud hosting (6 months): **$1,200-3,000**
- LLM API costs (6 months): **$600-1,800**
- Research materials (printing, travel): **$500**
- **Total: ~$2,300-5,300**

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 1: Problem-Centered Design | 6 weeks | Requirements Specification |
| Phase 2: Artifact Development | 20 weeks | Functional System Prototype |
| Phase 3: Evaluation | 8 weeks | Evaluation Report |
| Thesis Writing & Defense | 6 weeks | MSc Thesis |
| **Total** | **~40 weeks (10 months)** | **Degree + Deployed System** |

---

## Current Focus (Next 4 Weeks)

### Priority 1: Knowledge Base Setup
- [ ] Set up vector database (Pinecone or FAISS)
- [ ] Implement policy document parser
- [ ] Create embedding service
- [ ] Test ingestion pipeline with sample policies

### Priority 2: RAG Pipeline
- [ ] Integrate LangChain
- [ ] Configure semantic search
- [ ] Test with sample queries

### Priority 3: Basic Chat Interface
- [ ] Create simple chat UI
- [ ] Connect to backend API
- [ ] Test end-to-end flow

---

**For detailed methodology, see [METHODOLOGY_IMPLEMENTATION.md](./docs/METHODOLOGY_IMPLEMENTATION.md)**

**Last Updated:** January 29, 2026  
**Project Lead:** Ediomo Titus  
**Supervisor:** Dr. Mustapha Aminu Bagiwa
