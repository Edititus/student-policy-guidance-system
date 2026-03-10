# Research Methodology Implementation Guide

## Chapter 3: From Research Design to System Implementation

This document translates the research methodology (Chapter 3) into actionable development tasks for the AI-Based Student Policy Guidance System.

---

## 3.1 Research Design Overview

### Sequential Mixed-Methods Approach (DSR-Based)

```
Phase 1: Problem-Centered Design (Qualitative)
    ↓
Phase 2: Artifact Development (Technical)
    ↓
Phase 3: Evaluation (Mixed Methods)
```

---

## 3.2 Phase 1: Problem-Centered Design

### Objective
Understand the problem space through qualitative data collection to inform requirements.

### Data Collection Activities

#### 1.1 Semi-Structured Interviews

**Administrator Interview Guide (10-15 staff)**
- Current policy management processes
- Pain points in policy interpretation
- Frequency and types of student inquiries
- Desired features for an AI system
- Concerns about AI adoption
- Technical infrastructure readiness

**Student Interview Guide (15-20 students)**
- Experience accessing policy information
- Challenges understanding policies
- Typical policy-related questions
- Preferred communication channels
- Trust in digital vs. human advice

**Sample Questions:**
- "Describe a time you needed to understand a policy rule. What was the process?"
- "What would make policy information easier to access?"
- "How comfortable would you be with an AI system providing policy guidance?"

#### 1.2 Document Analysis

**Protocol for Policy Document Analysis:**
1. Collect all student policy documents (handbooks, regulations, senate bulletins)
2. Identify:
   - Key policy entities (Student, Course, Appeal, Deferment, etc.)
   - Rules and conditions (IF-THEN structures)
   - Exceptions and edge cases
   - Procedural workflows
   - Ambiguities and unclear clauses

**Analysis Template:**
```
Policy Area: [e.g., Academic Probation]
Rule Type: [Eligibility / Procedure / Sanction]
Condition: [e.g., CGPA < 1.5 for two consecutive semesters]
Action: [e.g., Student placed on probation]
Exceptions: [e.g., Medical evidence may defer probation]
Dependencies: [Links to other policies]
Ambiguity Level: [Low / Medium / High]
```

### Deliverables

- [ ] Interview transcripts (10-15 admin + 15-20 students)
- [ ] Policy document inventory and categorization
- [ ] Requirements specification document
- [ ] Conceptual data model (entities, relationships)
- [ ] User personas (student, administrator)

---

## 3.3 Phase 2: Artifact Development

### System Architecture (From Research Proposal)

```
┌─────────────────────────────────────────────────────┐
│            Frontend (React + TypeScript)            │
│   - Chat Interface                                  │
│   - Policy Query Input (Text/Voice)                 │
│   - Response Display with Citations                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ REST API
                   │
┌──────────────────▼──────────────────────────────────┐
│         Backend (Node.js + Express)                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │   NLP & Intent Recognition Module            │  │
│  │   - Entity extraction                         │  │
│  │   - Query classification                      │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐  │
│  │   AI & Retrieval Module (RAG Pipeline)       │  │
│  │   - Vector search in policy embeddings       │  │
│  │   - LangChain / Haystack integration         │  │
│  │   - LLM (GPT / Hugging Face Transformer)     │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐  │
│  │   Rule-Based Inference Engine                │  │
│  │   - Policy knowledge base (formalized rules) │  │
│  │   - Forward-chaining logic                   │  │
│  │   - Exception handling                       │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐  │
│  │   Response Generation & Explanation          │  │
│  │   - Confidence scoring                       │  │
│  │   - Source citation                          │  │
│  │   - Escalation logic                         │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Data Layer
                   │
┌──────────────────▼──────────────────────────────────┐
│  Vector Database (Pinecone / Weaviate / FAISS)     │
│  - Policy document embeddings                       │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  PostgreSQL Database                                │
│  - User sessions                                    │
│  - Interaction logs                                 │
│  - Performance metrics                              │
└─────────────────────────────────────────────────────┘
```

### Development Tasks (Mapped to Current Codebase)

#### Task 2.1: Data Preprocessing and Knowledge Base Creation

**Current Status:** ✅ Basic structure exists  
**Next Steps:**

```typescript
// apps/backend/src/services/policyService.ts
export interface IPolicyService {
  parseHandbook(filePath: string): Promise<PolicyDocument[]>
  createEmbeddings(documents: PolicyDocument[]): Promise<PolicyEmbedding[]>
  storeInVectorDB(embeddings: PolicyEmbedding[]): Promise<void>
}

// apps/backend/src/models/Policy.ts
export interface PolicyDocument {
  id: string
  category: PolicyCategory
  title: string
  content: string
  rules: PolicyRule[]
  metadata: PolicyMetadata
}

export interface PolicyRule {
  id: string
  condition: string
  action: string
  exceptions: string[]
  dependencies: string[]
}

export enum PolicyCategory {
  REGISTRATION = 'registration',
  DEFERMENT = 'deferment',
  WITHDRAWAL = 'withdrawal',
  MISCONDUCT = 'misconduct',
  APPEALS = 'appeals'
}
```

**Implementation Steps:**
1. [ ] Create policy document parser (PDF/DOCX → structured JSON)
2. [ ] Implement text embedding service (OpenAI API / Sentence-BERT)
3. [ ] Set up vector database (Pinecone or FAISS)
4. [ ] Create policy ingestion pipeline

#### Task 2.2: AI and Retrieval Module (RAG Pipeline)

**Current Status:** ❌ Not implemented  
**Next Steps:**

```typescript
// apps/backend/src/services/ragService.ts
export interface IRAGService {
  retrieveRelevantPolicies(query: string): Promise<PolicyDocument[]>
  generateResponse(query: string, context: PolicyDocument[]): Promise<AIResponse>
}

export interface AIResponse {
  answer: string
  confidence: number
  sources: PolicySource[]
  reasoning: string[]
  escalationNeeded: boolean
}
```

**Implementation Steps:**
1. [ ] Integrate LangChain or Haystack
2. [ ] Configure vector similarity search
3. [ ] Implement prompt engineering for policy Q&A
4. [ ] Add response generation with citations

#### Task 2.3: Rule-Based Inference Engine

**Current Status:** ✅ Basic controller exists  
**Next Steps:**

```typescript
// apps/backend/src/services/inferenceEngine.ts
export interface IInferenceEngine {
  applyRules(studentContext: StudentContext, policyArea: PolicyCategory): Promise<InferenceResult>
  explainDecision(result: InferenceResult): Promise<Explanation>
}

export interface StudentContext {
  studentId: string
  currentCGPA: number
  semesterHistory: SemesterRecord[]
  activeAppeals: Appeal[]
  // ... other relevant context
}

export interface InferenceResult {
  decision: string
  applicableRules: PolicyRule[]
  confidence: number
  requiresHumanReview: boolean
}
```

**Implementation Steps:**
1. [ ] Formalize policy rules from Phase 1 analysis
2. [ ] Implement forward-chaining algorithm
3. [ ] Add exception handling logic
4. [ ] Create explainability module

#### Task 2.4: Frontend Chat Interface

**Current Status:** ✅ Basic UI exists with Tailwind  
**Next Steps:**

```typescript
// apps/frontend/src/components/PolicyChatbot.tsx
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: PolicySource[]
  confidence?: number
  timestamp: Date
}

// Features to implement:
// - Chat history
// - Source citations display
// - Confidence indicator
// - Escalation notification
// - Voice input (optional)
```

**Implementation Steps:**
1. [ ] Create chat interface component
2. [ ] Add message history management
3. [ ] Implement source citation display
4. [ ] Add feedback mechanism (thumbs up/down)
5. [ ] Create confidence level visualization

#### Task 2.5: HITL Administrator Dashboard

**Current Status:** ❌ Not implemented  
**Next Steps:**

```typescript
// apps/frontend/src/pages/AdminDashboard.tsx
// Features:
// - View all student queries
// - Review AI responses
// - Override/clarify responses
// - Update knowledge base
// - View system metrics
// - Manage escalated cases
```

**Implementation Steps:**
1. [ ] Design admin UI mockups
2. [ ] Implement query review interface
3. [ ] Add knowledge base editor
4. [ ] Create metrics dashboard
5. [ ] Build escalation queue

---

## 3.4 Phase 3: Evaluation

### Pilot Deployment (4-6 Weeks)

**Pilot Scope:**
- 2 universities in Abuja
- 150-200 students (stratified random sample)
- 10-15 administrative staff
- Selected departments/faculties

### Evaluation Metrics

#### 3.4.1 Technical Performance Metrics

**System Performance Logging Tool:**

```typescript
// apps/backend/src/services/metricsService.ts
export interface PerformanceMetrics {
  queryResponseTime: number // milliseconds
  accuracy: number // % correct responses (vs human expert)
  relevanceScore: number // user-rated relevance (1-5)
  confidenceScore: number // system-generated confidence
  escalationRate: number // % queries escalated to human
  successfulResolution: number // % queries resolved without human
}

// Automated logging for each query
export interface QueryLog {
  id: string
  timestamp: Date
  userId: string
  query: string
  response: AIResponse
  userFeedback?: Feedback
  adminReview?: AdminReview
  metrics: PerformanceMetrics
}
```

**Target Performance:**
- Response time: < 3 seconds
- Accuracy: > 85% (validated against human experts)
- User satisfaction: > 4.0/5.0
- Escalation rate: < 20%

#### 3.4.2 User Satisfaction Metrics

**Post-Interaction Survey (Likert Scale 1-5):**

Based on Technology Acceptance Model (TAM):

1. **Perceived Usefulness**
   - "The system helped me find the policy information I needed"
   - "The system saved me time compared to traditional methods"
   - "The system's responses were accurate"

2. **Perceived Ease of Use**
   - "The system was easy to interact with"
   - "I understood how to use the system without training"
   - "The system's responses were clear and understandable"

3. **Trust and Satisfaction**
   - "I trust the information provided by the system"
   - "I would use this system again"
   - "I would recommend this system to other students"

4. **System Quality**
   - "The system responded quickly"
   - "The system provided sources for its answers"
   - "The system knew when to refer me to a human administrator"

#### 3.4.3 Institutional Impact Assessment

**Focus Group Discussion Guides:**

**Student Focus Groups (3-4 groups, 6-8 students each):**
- Overall experience with the system
- Comparison to previous policy information methods
- Trust in AI-generated guidance
- Suggestions for improvement
- Willingness to continue using

**Staff Focus Groups (2-3 groups, 4-6 staff each):**
- Impact on administrative workload
- Quality of student inquiries after system use
- Changes in policy consistency
- Concerns about oversight
- Suggestions for institutional adoption

**Qualitative Themes to Explore:**
- Perceived fairness and transparency
- Cultural acceptance of AI in governance
- Institutional readiness and barriers
- Unintended consequences
- Long-term sustainability

---

## 3.5 Data Analysis Methods

### Phase 1 Analysis (Qualitative)

**Thematic Analysis (Braun & Clarke, 2006):**

1. Familiarization: Read transcripts repeatedly
2. Generate initial codes
3. Search for themes
4. Review themes
5. Define and name themes
6. Produce report

**Tools:** NVivo, Atlas.ti, or manual coding

**Outputs:**
- Requirements specification
- Key pain points and themes
- User needs hierarchy
- Conceptual policy model

### Phase 2 Analysis (Technical Validation)

**Expert Review Checklist:**

- [ ] System architecture aligns with requirements
- [ ] Knowledge representation is accurate
- [ ] Rule formalization is complete
- [ ] NLP module handles edge cases
- [ ] Explainability mechanisms are clear
- [ ] HITL escalation pathways are functional

**Validation Method:** Heuristic evaluation by 3-4 experts

### Phase 3 Analysis (Mixed Methods)

**Quantitative (SPSS / Python Pandas):**
- Descriptive statistics (means, SDs, frequencies)
- Performance metric aggregation
- Survey response analysis
- Correlation analysis (satisfaction vs. performance)

**Qualitative (Content Analysis):**
- Code focus group transcripts
- Identify themes in user feedback
- Categorize strengths, weaknesses, impact areas

**Integration:**
- Triangulate quantitative metrics with qualitative insights
- Explain "why" behind performance patterns
- Identify areas for refinement

---

## 3.6 Ethical Considerations (Implementation)

### Institutional Approval
- [ ] Obtain ethics clearance from Veritas University
- [ ] Secure approval from participating universities
- [ ] Document MoU for data sharing and IP

### Informed Consent
- [ ] Prepare participant information sheets
- [ ] Design consent forms
- [ ] Implement consent tracking in system

### Confidentiality & Anonymization
```typescript
// Implement in backend
export const anonymizeUserData = (data: UserQuery): AnonymizedQuery => {
  return {
    queryId: data.id,
    queryText: data.query,
    timestamp: data.timestamp,
    // Remove: userId, email, student number
  }
}
```

### System Disclaimers
```typescript
// Frontend: Display on first use
const SYSTEM_DISCLAIMER = `
This system provides policy guidance based on official university documents.
While we strive for accuracy, this is a decision-support tool, not a 
replacement for official university decisions. For critical matters, please 
consult with the relevant administrative office. Your interactions are logged 
anonymously for research purposes.
`
```

### HITL Escalation Triggers
```typescript
export const shouldEscalate = (response: AIResponse): boolean => {
  return (
    response.confidence < 0.7 ||
    response.category === PolicyCategory.MISCONDUCT ||
    response.requiresHumanReview ||
    userRequestsHuman
  )
}
```

---

## Implementation Timeline (Proposed)

### Phase 1: Problem-Centered Design (4-6 weeks)
- Week 1-2: Conduct interviews
- Week 3-4: Analyze documents and transcripts
- Week 5-6: Requirements specification

### Phase 2: Artifact Development (12-16 weeks)
- Week 1-4: Knowledge base and embeddings
- Week 5-8: RAG pipeline and inference engine
- Week 9-12: Frontend interface
- Week 13-16: Admin dashboard and testing

### Phase 3: Evaluation (6-8 weeks)
- Week 1-2: Pilot preparation and training
- Week 3-6: Live pilot deployment
- Week 7-8: Data analysis and reporting

**Total Duration: ~26-30 weeks (~6-7 months)**

---

## Current Implementation Status

Based on existing codebase:

✅ **Completed:**
- Monorepo structure
- Backend API skeleton (Express + TypeScript)
- Frontend UI skeleton (React + Tailwind)
- Shared types package
- Testing framework
- CI/CD pipeline

❌ **Not Yet Implemented:**
- NLP and RAG pipeline
- Vector database integration
- Policy knowledge base
- Rule-based inference engine
- Chat interface
- Admin dashboard
- Performance logging
- User authentication

📋 **Next Priority:**
1. Set up vector database (Pinecone/FAISS)
2. Implement policy document parser
3. Create embedding service
4. Build RAG pipeline
5. Develop chat interface

---

## Success Criteria (Phase 3 Evaluation)

### Technical Success
- ✅ System accuracy > 85%
- ✅ Response time < 3 seconds
- ✅ Escalation rate < 20%
- ✅ Zero critical system failures during pilot

### User Acceptance Success
- ✅ User satisfaction > 4.0/5.0
- ✅ > 70% of users would recommend
- ✅ > 75% of users report time savings

### Institutional Impact Success
- ✅ Measurable reduction in staff policy inquiry workload
- ✅ Positive qualitative feedback from administrators
- ✅ Demonstrated improvement in policy consistency
- ✅ Institutional willingness to continue pilot/adopt

---

## Documentation Requirements

All phases must produce:
- [ ] Detailed technical documentation
- [ ] User guides (students and admins)
- [ ] Evaluation reports
- [ ] Lessons learned document
- [ ] Recommendations for scale-up

---

**For detailed research context, see [RESEARCH_OVERVIEW.md](../RESEARCH_OVERVIEW.md)**
