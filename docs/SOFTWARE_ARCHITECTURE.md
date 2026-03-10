# 📐 Software Architecture Documentation

## Complete System Design for Academic Submission

**Project:** AI-Based Student Policy Guidance System  
**Student:** Ediomo Titus (VPG/MSC/CSC/24/13314)  
**Institution:** Veritas University Abuja  
**Date:** January 2026

---

## Table of Contents
1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [Database Schema (ER Diagram)](#2-database-schema-er-diagram)
3. [Use Case Diagram](#3-use-case-diagram)
4. [Sequence Diagrams](#4-sequence-diagrams)
5. [Class Diagram](#5-class-diagram)
6. [Component Diagram](#6-component-diagram)
7. [Deployment Diagram](#7-deployment-diagram)
8. [Data Flow Diagram](#8-data-flow-diagram)
9. [User Stories](#9-user-stories)
10. [Non-Functional Requirements](#10-non-functional-requirements)

---

## 1. System Architecture Diagram

### High-Level Architecture (4-Tier)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (Port 5173)                              │  │
│  │  - PolicyChatbot Component                               │  │
│  │  - Admin Dashboard                                       │  │
│  │  - Authentication UI                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     APPLICATION TIER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js/Express API Server (Port 4000)                  │  │
│  │                                                           │  │
│  │  Controllers:                                            │  │
│  │  - ChatController         (handles queries)              │  │
│  │  - PolicyController       (admin functions)              │  │
│  │  - AuthController         (authentication)               │  │
│  │  - AdminController        (dashboard features)           │  │
│  │                                                           │  │
│  │  Services:                                               │  │
│  │  - RAGService            (orchestrates AI pipeline)      │  │
│  │  - EmbeddingService      (OpenAI embeddings)            │  │
│  │  - PolicyParserService   (PDF/DOCX parsing)             │  │
│  │  - InferenceEngine       (rule-based logic, future)     │  │
│  │  - AnalyticsService      (metrics, future)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────┬───────────────────────────┘
                     │                │
         ┌───────────▼─────┐    ┌────▼──────────────┐
         │                 │    │                    │
┌────────▼─────────────────▼────▼────────────────────▼────────────┐
│                     DATA TIER                                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ PostgreSQL       │  │ Vector Database  │  │ File Storage │ │
│  │                  │  │ (Pinecone/FAISS) │  │              │ │
│  │ - Users          │  │                  │  │ - Uploaded   │ │
│  │ - Policies       │  │ - Policy         │  │   PDFs       │ │
│  │ - Queries        │  │   Embeddings     │  │ - Backups    │ │
│  │ - Responses      │  │ - Chunk Vectors  │  │              │ │
│  │ - Feedback       │  │                  │  │              │ │
│  │ - Analytics      │  │ (1536 dimensions)│  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                  EXTERNAL SERVICES TIER                        │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ OpenAI API       │  │ Email Service    │                  │
│  │                  │  │ (SendGrid)       │                  │
│  │ - GPT-4o-mini    │  │                  │                  │
│  │ - Embeddings API │  │ - Notifications  │                  │
│  └──────────────────┘  └──────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (ER Diagram)

### PostgreSQL Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         ENTITY-RELATIONSHIP DIAGRAM             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     Student      │
├──────────────────┤
│ PK student_id    │───────┐
│    email         │       │
│    first_name    │       │ 1
│    last_name     │       │
│    matric_number │       │
│    program       │       │
│    year          │       │
│    level         │       │
│    cgpa          │       │
│    created_at    │       │
│    updated_at    │       │
└──────────────────┘       │
                           │
                           │ 1:N (One student, many queries)
                           │
┌──────────────────┐       │
│  Administrator   │       │
├──────────────────┤       │
│ PK admin_id      │       │
│    email         │       │
│    name          │       │
│    role          │       │
│    created_at    │       │
└──────────────────┘       │
        │                  │
        │ 1:N              │
        │                  │
┌───────▼──────────┐  ┌────▼──────────────┐
│ PolicyDocument   │  │   PolicyQuery     │
├──────────────────┤  ├───────────────────┤
│ PK policy_id     │  │ PK query_id       │◄─────┐
│    title         │  │ FK student_id     │      │
│    category      │  │    query_text     │      │
│    content       │  │    session_id     │      │
│    summary       │  │    timestamp      │      │ 1:1
│    institution   │  │    ip_address     │      │
│    status        │  │    user_agent     │      │
│    source_file   │  └───────────────────┘      │
│    page_ref      │            │                 │
│ FK created_by    │            │ 1:1             │
│    created_at    │            │                 │
│    updated_at    │  ┌─────────▼─────────────┐  │
└──────────────────┘  │   PolicyResponse      │  │
        │             ├───────────────────────┤  │
        │ 1:N         │ PK response_id        │  │
        │             │ FK query_id           │──┘
┌───────▼──────────┐  │    answer_text       │
│   PolicyRule     │  │    confidence        │───┐
├──────────────────┤  │    reasoning         │   │
│ PK rule_id       │  │    escalated         │   │
│ FK policy_id     │  │    timestamp         │   │
│    condition     │  │    processing_time   │   │
│    action        │  └───────────────────────┘   │
│    exceptions    │            │                  │
│    consequences  │            │ 1:N              │
│    priority      │            │                  │
└──────────────────┘  ┌─────────▼─────────────┐   │
        │             │   ResponseSource      │   │
        │ M:N         ├───────────────────────┤   │
        │             │ PK source_id          │   │
┌───────▼──────────┐  │ FK response_id        │   │
│ PolicyEmbedding  │  │ FK policy_id          │   │
├──────────────────┤  │    excerpt            │   │
│ PK embedding_id  │  │    page_reference     │   │
│ FK policy_id     │  │    relevance_score    │   │
│    chunk_text    │  └───────────────────────┘   │
│    chunk_index   │                               │
│    vector_id     │  ┌───────────────────────┐   │
│    metadata      │  │   UserFeedback        │   │
└──────────────────┘  ├───────────────────────┤   │
                      │ PK feedback_id        │   │
                      │ FK response_id        │───┘
                      │ FK student_id         │
                      │    helpful            │ (boolean)
                      │    rating             │ (1-5)
                      │    comment            │
                      │    timestamp          │
                      └───────────────────────┘
                                │
                                │ 1:N
                      ┌─────────▼───────────┐
                      │   QueryAnalytics    │
                      ├─────────────────────┤
                      │ PK analytics_id     │
                      │    date             │
                      │    total_queries    │
                      │    avg_confidence   │
                      │    escalation_rate  │
                      │    avg_rating       │
                      │    unique_students  │
                      └─────────────────────┘
```

### Vector Database Schema (Pinecone/FAISS)

```
┌────────────────────────────────────────────────────────┐
│              VECTOR DATABASE STRUCTURE                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Index: "policy-embeddings"                           │
│  Dimensions: 1536 (OpenAI text-embedding-3-small)    │
│                                                        │
│  Vector Record:                                        │
│  {                                                     │
│    id: "policy_123_chunk_5",                          │
│    values: [0.02, -0.15, 0.33, ...],  // 1536 floats │
│    metadata: {                                        │
│      policy_id: "policy_123",                        │
│      policy_title: "Course Registration",            │
│      category: "ACADEMIC",                           │
│      chunk_index: 5,                                 │
│      chunk_text: "Students must register...",        │
│      institution: "Veritas University",              │
│      source_page: 15                                 │
│    }                                                  │
│  }                                                    │
│                                                        │
│  Query Operation:                                      │
│  - Input: Question embedding [1536 floats]           │
│  - Output: Top K similar vectors (ranked)            │
│  - Similarity: Cosine distance                       │
│  - Filter: By category, institution (optional)       │
└────────────────────────────────────────────────────────┘
```

---

## 3. Use Case Diagram

```
                    AI-Based Student Policy Guidance System
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│   ┌─────────┐                                                  │
│   │         │                                                  │
│   │ Student │───────────────────────────────────────┐          │
│   │         │                                       │          │
│   └─────────┘                                       │          │
│        │                                            │          │
│        │                                            │          │
│        │  (Ask Policy Question)                    │          │
│        ├─────────►(Query Policy)                   │          │
│        │             │                              │          │
│        │             │ «include»                   │          │
│        │             ├────►(View Answer)           │          │
│        │             │                              │          │
│        │             │ «include»                   │          │
│        │             └────►(View Source Citations) │          │
│        │                                            │          │
│        │  (Rate Response)                          │          │
│        ├─────────►(Submit Feedback)                │          │
│        │                                            │          │
│        │  (Check Previous Queries)                 │          │
│        └─────────►(View Query History)             │          │
│                                                     │          │
│                                                     │          │
│   ┌─────────────┐                                  │          │
│   │             │                                  │          │
│   │ Admin Staff │──────────────────────────────────┘          │
│   │             │                                              │
│   └─────────────┘                                              │
│        │                                                       │
│        │  (Upload Policy Documents)                           │
│        ├─────────►(Manage Knowledge Base)                     │
│        │             │                                         │
│        │             │ «include»                              │
│        │             ├────►(Parse PDF/DOCX)                   │
│        │             │                                         │
│        │             │ «include»                              │
│        │             └────►(Generate Embeddings)              │
│        │                                                       │
│        │  (Review Flagged Queries)                            │
│        ├─────────►(Monitor Escalated Queries)                 │
│        │             │                                         │
│        │             │ «extend»                               │
│        │             └────►(Override AI Response)             │
│        │                                                       │
│        │  (View Statistics)                                   │
│        ├─────────►(Analyze Query Trends)                      │
│        │             │                                         │
│        │             │ «include»                              │
│        │             ├────►(View Accuracy Metrics)            │
│        │             │                                         │
│        │             │ «include»                              │
│        │             └────►(Export Reports)                   │
│        │                                                       │
│        │  (Edit Policies)                                     │
│        └─────────►(Update Policy Content)                     │
│                       │                                        │
│                       │ «extend»                              │
│                       └────►(Trigger Re-embedding)            │
│                                                                 │
│                                                                 │
│   ┌────────────┐                                               │
│   │            │           (System Administration)            │
│   │ Supervisor │─────────►(Review System Performance)         │
│   │            │             │                                 │
│   └────────────┘             │ «include»                      │
│                              └────►(Approve Major Changes)     │
│                                                                 │
│                                                                 │
│   «System»                                                     │
│   ┌────────────┐                                               │
│   │            │           (Background Tasks)                  │
│   │ Scheduler  │─────────►(Generate Daily Analytics)          │
│   │            │             │                                 │
│   └────────────┘             └────►(Send Escalation Alerts)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Legend:
────► : Association
«include» : Included use case (always happens)
«extend» : Extended use case (conditional)
```

---

## 4. Sequence Diagrams

### 4.1 Student Asks Policy Question

```
Student    Frontend    ChatController    RAGService    EmbeddingService    VectorDB    PostgreSQL    OpenAI
  │           │              │               │                │             │            │           │
  ├─Query────►│              │               │                │             │            │           │
  │           │              │               │                │             │            │           │
  │           ├─POST /api/chat/query────────►│               │             │            │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─getStudentContext()──────────────────────►│           │
  │           │              │               │◄───────────────────────────────────────────┤           │
  │           │              │               │  (program, year, CGPA)                    │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─generateEmbedding(question)──────────────────────────►│
  │           │              │               │                │             │            │           │
  │           │              │               │◄──────────────────────────────────────────────────────┤
  │           │              │               │  [0.02, -0.15, ...]                       │           │
  │           │              │               │                │             │            │           │
  │           │              │               │                ├─searchSimilar(vector)───►│           │
  │           │              │               │                │             │            │           │
  │           │              │               │                │◄────────────┤            │           │
  │           │              │               │                │  Top 5 chunks            │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─getPolicies(chunk_ids)───────────────────►│           │
  │           │              │               │◄───────────────────────────────────────────┤           │
  │           │              │               │  Policy full text                         │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─buildContext(chunks, student)             │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─generateAnswer(context)──────────────────────────────►│
  │           │              │               │                │             │            │  (GPT-4)  │
  │           │              │               │◄──────────────────────────────────────────────────────┤
  │           │              │               │  AI-generated answer                      │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─calculateConfidence(similarity_scores)    │           │
  │           │              │               │                │             │            │           │
  │           │              │               ├─saveInteraction(query, response)─────────►│           │
  │           │              │◄──────────────┤                │             │            │           │
  │           │              │  Response     │                │             │            │           │
  │           │              │  {            │                │             │            │           │
  │           │              │    answer,    │                │             │            │           │
  │           │              │    confidence,│                │             │            │           │
  │           │              │    sources[]  │                │             │            │           │
  │           │              │  }            │                │             │            │           │
  │           │◄─────────────┤                │                │             │            │           │
  │◄──────────┤              │                │                │             │            │           │
  │  Display  │              │                │                │             │            │           │
  │  Answer   │              │                │                │             │            │           │
```

### 4.2 Admin Uploads Policy Document

```
Admin     Frontend    PolicyController    ParserService    EmbeddingService    VectorDB    PostgreSQL
  │           │              │                  │                 │              │            │
  ├─Upload PDF│              │                  │                 │              │            │
  │           ├─POST /api/policies/upload──────►│                 │              │            │
  │           │  (multipart/form-data)          │                 │              │            │
  │           │              │                  │                 │              │            │
  │           │              ├─saveFile()───────┤                 │              │            │
  │           │              │                  │                 │              │            │
  │           │              ├─parseDocument(filepath)───────────►│              │            │
  │           │              │                  │                 │              │            │
  │           │              │                  ├─parsePDF()      │              │            │
  │           │              │                  ├─extractText()   │              │            │
  │           │              │                  ├─categorize()    │              │            │
  │           │              │                  ├─extractRules()  │              │            │
  │           │              │◄─────────────────┤                 │              │            │
  │           │              │  Structured Data │                 │              │            │
  │           │              │                  │                 │              │            │
  │           │              ├─createPolicy(data)────────────────────────────────────────────►│
  │           │              │◄────────────────────────────────────────────────────────────────┤
  │           │              │  policy_id                                        │            │
  │           │              │                  │                 │              │            │
  │           │              ├─chunkText(content)───────────────►│              │            │
  │           │              │                  │                 │              │            │
  │           │              │                  ├─generateEmbeddings(chunks[])──►│  OpenAI   │
  │           │              │                  │◄────────────────────────────────┤            │
  │           │              │                  │  embeddings[]                   │            │
  │           │              │                  │                 │              │            │
  │           │              │                  ├─storeVectors(embeddings)───────►│            │
  │           │              │                  │◄────────────────────────────────┤            │
  │           │              │                  │  success                        │            │
  │           │              │                  │                 │              │            │
  │           │◄─────────────┤                  │                 │              │            │
  │           │  {           │                  │                 │              │            │
  │           │    success,  │                  │                 │              │            │
  │           │    policy_id,│                  │                 │              │            │
  │           │    chunks: 15│                  │                 │              │            │
  │           │  }           │                  │                 │              │            │
  │◄──────────┤              │                  │                 │              │            │
  │  Success  │              │                  │                 │              │            │
  │  Message  │              │                  │                 │              │            │
```

### 4.3 Low Confidence → Escalation Flow

```
Student    RAGService    PostgreSQL    EmailService    AdminDashboard
  │            │             │               │              │
  ├─Query─────►│             │               │              │
  │            │             │               │              │
  │            ├─process()   │               │              │
  │            │             │               │              │
  │            ├─confidence: LOW (< 0.7)     │              │
  │            │             │               │              │
  │            ├─markEscalated(query_id)────►│              │
  │            │             │               │              │
  │            ├─sendAlert(admin_email)──────────────────►  │
  │            │             │               │              │
  │            │             │               ├─notify()────►│
  │            │             │               │  "New        │
  │            │             │               │  escalated   │
  │            │             │               │  query"      │
  │◄───────────┤             │               │              │
  │  "I'm not  │             │               │              │
  │   sure.    │             │               │              │
  │   Contact  │             │               │              │
  │   admin."  │             │               │              │
  │            │             │               │              │
  │            │             │               │      Admin Reviews
  │            │             │               │◄─────────────┤
  │            │             │               │              │
  │            │             │◄──updateResponse(correct_answer)
  │            │             │               │              │
  │◄───────────notification──┤               │              │
  │  "Admin    │             │               │              │
  │  has       │             │               │              │
  │  replied"  │             │               │              │
```

---

## 5. Class Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         CLASS DIAGRAM                          │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│  «interface»             │
│  IPolicyService          │
├──────────────────────────┤
│ + parseDocument()        │
│ + categorize()           │
│ + extractRules()         │
└────────────┬─────────────┘
             │ implements
             │
┌────────────▼─────────────┐
│ PolicyParserService      │
├──────────────────────────┤
│ - pdfParser              │
│ - docxParser             │
├──────────────────────────┤
│ + parseDocument(path)    │
│ + parsePDF(buffer)       │
│ + parseDOCX(buffer)      │
│ + extractMetadata(text)  │
│ + categorizePolicy(text) │
│ + extractRules(text)     │
│ + chunkText(text, size)  │
└──────────────────────────┘


┌──────────────────────────┐
│  «interface»             │
│  IEmbeddingService       │
├──────────────────────────┤
│ + generateEmbedding()    │
│ + searchSimilar()        │
└────────────┬─────────────┘
             │ implements
             │
┌────────────▼─────────────┐         ┌──────────────────────┐
│ EmbeddingService         │────────►│ OpenAI               │
├──────────────────────────┤  uses   ├──────────────────────┤
│ - openaiClient           │         │ + createEmbedding()  │
│ - model: string          │         │ + chat.completions   │
├──────────────────────────┤         └──────────────────────┘
│ + generateEmbedding(str) │
│ + generateBatch(arr)     │
│ + cosineSimilarity()     │
│ + searchSimilar(query)   │
└──────────────────────────┘


┌──────────────────────────┐
│  «interface»             │
│  IRAGService             │
├──────────────────────────┤
│ + answerQuery()          │
│ + addPolicy()            │
└────────────┬─────────────┘
             │ implements
             │
┌────────────▼─────────────┐
│ RAGService               │◄────────┐
├──────────────────────────┤         │
│ - embeddingService       │──────┐  │ uses
│ - policyEmbeddings[]     │      │  │
│ - policies: Map          │      │  │
│ - model: string          │      │  │
├──────────────────────────┤      │  │
│ + answerQuery(query)     │      │  │
│ + addPolicy(policy)      │      │  │
│ + loadPolicies(arr)      │      │  │
│ + buildContext()         │      │  │
│ - determineConfidence()  │      │  │
│ - extractSources()       │      │  │
│ + getStats()             │      │  │
└──────────────────────────┘      │  │
             │                    │  │
             │ uses               │  │
             │                    │  │
┌────────────▼─────────────┐      │  │
│ ChatController           │      │  │
├──────────────────────────┤      │  │
│ - ragService             │──────┘  │
├──────────────────────────┤         │
│ + askQuestion(req, res)  │         │
│ + getStats(req, res)     │         │
│ + submitFeedback()       │         │
└──────────────────────────┘         │
                                     │
┌──────────────────────────┐         │
│ PolicyController         │         │
├──────────────────────────┤         │
│ - parserService          │─────────┘
│ - ragService             │
├──────────────────────────┤
│ + uploadPolicy()         │
│ + listPolicies()         │
│ + activatePolicy()       │
└──────────────────────────┘


┌──────────────────────────┐
│  «model»                 │
│  PolicyDocument          │
├──────────────────────────┤
│ + id: string             │
│ + title: string          │
│ + category: enum         │
│ + content: string        │
│ + summary: string        │
│ + rules: PolicyRule[]    │
│ + metadata: object       │
│ + status: enum           │
│ + tags: string[]         │
│ + createdAt: Date        │
│ + updatedAt: Date        │
└────────────┬─────────────┘
             │ has many
             │
┌────────────▼─────────────┐
│  «model»                 │
│  PolicyRule              │
├──────────────────────────┤
│ + id: string             │
│ + condition: string      │
│ + action: string         │
│ + exceptions: string[]   │
│ + consequences: string   │
│ + ambiguityLevel: enum   │
└──────────────────────────┘


┌──────────────────────────┐
│  «model»                 │
│  PolicyQuery             │
├──────────────────────────┤
│ + id: string             │
│ + query: string          │
│ + studentContext: object │
│ + timestamp: Date        │
│ + sessionId: string      │
└────────────┬─────────────┘
             │ 1:1
             │
┌────────────▼─────────────┐
│  «model»                 │
│  PolicyResponse          │
├──────────────────────────┤
│ + id: string             │
│ + queryId: string        │
│ + answer: string         │
│ + confidence: enum       │
│ + sources: object[]      │
│ + reasoning: string      │
│ + escalated: boolean     │
│ + timestamp: Date        │
└──────────────────────────┘


┌──────────────────────────┐
│  «model»                 │
│  PolicyEmbedding         │
├──────────────────────────┤
│ + id: string             │
│ + policyId: string       │
│ + chunkText: string      │
│ + embedding: number[]    │
│ + chunkIndex: number     │
│ + metadata: object       │
└──────────────────────────┘
```

---

## 6. Component Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      COMPONENT DIAGRAM                        │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Application                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │PolicyChatbot │  │AdminDashboard│  │AuthProvider │ │ │
│  │  │Component     │  │Component     │  │             │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │ │
│  │         │                 │                  │         │ │
│  │         └─────────────────┴──────────────────┘         │ │
│  │                           │                            │ │
│  │                  ┌────────▼─────────┐                 │ │
│  │                  │  API Client      │                 │ │
│  │                  │  (Axios/Fetch)   │                 │ │
│  │                  └────────┬─────────┘                 │ │
│  └───────────────────────────┼──────────────────────────┘ │
└────────────────────────────┬─┼──────────────────────────┘
                             │ │ HTTPS/REST
                             │ │
┌────────────────────────────▼─▼──────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express.js Server                                     │ │
│  │  ┌───────────────┐  ┌────────────────┐               │ │
│  │  │ CORS Middleware│ │Auth Middleware │               │ │
│  │  └───────┬────────┘  └────────┬───────┘               │ │
│  │          │                    │                        │ │
│  │          └────────────────────┘                        │ │
│  │                    │                                   │ │
│  │          ┌─────────▼─────────────┐                    │ │
│  │          │  Route Handler        │                    │ │
│  │          │  /api/chat/*          │                    │ │
│  │          │  /api/policies/*      │                    │ │
│  │          │  /api/auth/*          │                    │ │
│  │          └─────────┬─────────────┘                    │ │
│  └────────────────────┼──────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Chat          │  │Policy        │  │Analytics     │     │
│  │Controller    │  │Controller    │  │Service       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │             │
│  ┌──────▼─────────────────▼──────────────────▼───────┐    │
│  │          Service Orchestration Layer               │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │RAG Service   │  │Parser Service│               │    │
│  │  │              │  │              │               │    │
│  │  │- Retrieval   │  │- PDF Parse   │               │    │
│  │  │- Generation  │  │- DOCX Parse  │               │    │
│  │  │- Confidence  │  │- Rule Extract│               │    │
│  │  └──────┬───────┘  └──────┬───────┘               │    │
│  │         │                 │                        │    │
│  │  ┌──────▼─────────────────▼──────────┐            │    │
│  │  │  Embedding Service                │            │    │
│  │  │  - Generate embeddings            │            │    │
│  │  │  - Cosine similarity              │            │    │
│  │  └──────┬────────────────────────────┘            │    │
│  └─────────┼─────────────────────────────────────────┘    │
└────────────┼─────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │PostgreSQL    │  │Vector DB     │  │File Storage  │     │
│  │Repository    │  │Client        │  │Service       │     │
│  │              │  │(Pinecone)    │  │              │     │
│  │- TypeORM     │  │- Vector CRUD │  │- S3/Local    │     │
│  │- Query       │  │- Similarity  │  │- Upload      │     │
│  │- Transaction │  │  Search      │  │- Download    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │OpenAI API    │  │Email Service │  │Monitoring    │     │
│  │- GPT-4       │  │(SendGrid)    │  │(Sentry)      │     │
│  │- Embeddings  │  │- SMTP        │  │- Logging     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

---

## 7. Deployment Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT DIAGRAM                         │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    STUDENT / ADMIN                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Web Browser (Chrome, Firefox, Safari)              │    │
│  │  - JavaScript Runtime                               │    │
│  │  - React Application (SPA)                          │    │
│  └────────────────────┬────────────────────────────────┘    │
└───────────────────────┼─────────────────────────────────────┘
                        │ HTTPS (Port 443)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              CLOUD INFRASTRUCTURE (AWS/Azure/GCP)            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Load Balancer                                         │ │
│  │  - SSL/TLS Termination                                │ │
│  │  - Rate Limiting                                      │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Frontend Server (Netlify / Vercel)                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Node: Frontend Container                        │ │ │
│  │  │  - Nginx Web Server                              │ │ │
│  │  │  - React Build (Static Assets)                   │ │ │
│  │  │  - Port: 80                                      │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │ HTTP (Internal)                     │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │  Backend Server Cluster (Docker/Kubernetes)           │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Node: API Server Instance 1                     │ │ │
│  │  │  - Node.js 18 Runtime                            │ │ │
│  │  │  - Express Application                           │ │ │
│  │  │  - Port: 4000                                    │ │ │
│  │  │  - CPU: 2 cores, RAM: 4GB                        │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Node: API Server Instance 2                     │ │ │
│  │  │  - Node.js 18 Runtime                            │ │ │
│  │  │  - Express Application                           │ │ │
│  │  │  - Port: 4000                                    │ │ │
│  │  │  - CPU: 2 cores, RAM: 4GB                        │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └───────────────┬────────────────────┬───────────────────┘ │
│                  │                    │                      │
│  ┌───────────────▼──────────┐  ┌──────▼────────────────┐   │
│  │  Database Server         │  │  Vector Database      │   │
│  │  ┌────────────────────┐  │  │  ┌─────────────────┐ │   │
│  │  │ Node: PostgreSQL   │  │  │  │ Node: Pinecone  │ │   │
│  │  │ - Version: 15      │  │  │  │   (Cloud)       │ │   │
│  │  │ - Port: 5432       │  │  │  │ - Dimensions:   │ │   │
│  │  │ - Storage: 100GB   │  │  │  │   1536          │ │   │
│  │  │ - Backup: Daily    │  │  │  │ - Metric:       │ │   │
│  │  └────────────────────┘  │  │  │   Cosine        │ │   │
│  └─────────────────────────┘  │  └─────────────────┘ │   │
│                                └──────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  File Storage (S3 / Azure Blob)                        │ │
│  │  - Uploaded PDFs                                       │ │
│  │  - Backups                                             │ │
│  │  - Logs                                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                  EXTERNAL SERVICES                            │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  OpenAI API      │  │  SendGrid        │                 │
│  │  (api.openai.com)│  │  (SMTP Service)  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Sentry          │  │  CloudWatch      │                 │
│  │  (Error Tracking)│  │  (Monitoring)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└───────────────────────────────────────────────────────────────┘

NETWORK DIAGRAM:
┌────────────────────────────────────────────────────────┐
│  VPC (Virtual Private Cloud)                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Public Subnet (10.0.1.0/24)                    │  │
│  │  - Load Balancer                                │  │
│  │  - Frontend Servers                             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Private Subnet 1 (10.0.2.0/24)                 │  │
│  │  - Backend API Servers                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Private Subnet 2 (10.0.3.0/24)                 │  │
│  │  - PostgreSQL Database                          │  │
│  │  - Redis Cache                                  │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 8. Data Flow Diagram (DFD)

### Level 0 - Context Diagram

```
                    ┌──────────────┐
                    │   Student    │
                    └──────┬───────┘
                           │
                    Policy │ Query
                    Answer │
                           │
            ┌──────────────▼──────────────────┐
            │                                 │
            │  AI-Based Student Policy        │◄──────Policy────┐
            │  Guidance System                │     Documents   │
            │                                 │                 │
            └──────────┬──────────┬───────────┘                 │
                       │          │                             │
              Analytics│          │ Escalated           ┌───────┴────────┐
                Report │          │ Queries             │ Administrator  │
                       │          │                     └────────────────┘
            ┌──────────▼──────┐   │
            │   Supervisor    │   │
            └─────────────────┘   │
                                  │
                      ┌───────────▼─────────┐
                      │  Admin Staff        │
                      └─────────────────────┘
```

### Level 1 - Main Processes

```
                  ┌──────────────┐
                  │   Student    │
                  └──────┬───────┘
                         │ Query
                         │
            ┌────────────▼────────────────┐
            │  1.0                        │
            │  Process Policy Query       │◄────Student Context────┐
            │                             │                        │
            └────────────┬────────────────┘                        │
                         │ Query + Context                         │
                         │                                 ┌───────┴───────┐
            ┌────────────▼────────────────┐               │  D1: Students │
            │  2.0                        │               └───────────────┘
            │  Retrieve Relevant Policies │
            │  (Semantic Search)          │◄────Policy Embeddings───┐
            └────────────┬────────────────┘                         │
                         │ Policy Chunks                            │
                         │                                  ┌───────┴────────┐
            ┌────────────▼────────────────┐                │ D2: Vector DB  │
            │  3.0                        │                └────────────────┘
            │  Generate Answer            │
            │  (RAG + GPT)                │◄────Policy Content───────┐
            └────────────┬────────────────┘                          │
                         │ Answer + Sources                          │
                         │                                   ┌───────┴────────┐
            ┌────────────▼────────────────┐                 │ D3: Policies   │
            │  4.0                        │                 └────────────────┘
            │  Evaluate Confidence        │
            │                             │
            └────────────┬────────────────┘
                         │
                    ┌────▼─────┐
                    │ HIGH?    │
                    └─┬────┬───┘
              YES     │    │ NO
         ┌────────────▼┐  ┌▼────────────────┐
         │  5.0         │  │  6.0            │
         │  Return to   │  │  Escalate to    │
         │  Student     │  │  Admin          │
         └──────┬───────┘  └─────┬───────────┘
                │                │ Alert
                │                │
                │           ┌────▼────────┐
                │           │Administrator│
                │           └─────┬───────┘
                │                 │ Override
                │                 │
         ┌──────▼─────────────────▼─────────┐
         │  7.0                             │
         │  Log Interaction                 │
         │  (Analytics)                     │
         └──────────┬───────────────────────┘
                    │
            ┌───────▼────────┐
            │ D4: Query Logs │
            └────────────────┘


┌────────────────────────────────────────────────────────────────┐
│                    Admin Processes                             │
└────────────────────────────────────────────────────────────────┘

                  ┌──────────────┐
                  │Administrator │
                  └──────┬───────┘
                         │ Upload PDF
                         │
            ┌────────────▼────────────────┐
            │  8.0                        │
            │  Parse Policy Document      │
            │                             │
            └────────────┬────────────────┘
                         │ Structured Data
                         │
            ┌────────────▼────────────────┐
            │  9.0                        │
            │  Generate Embeddings        │◄────OpenAI API
            │                             │
            └────────────┬────────────────┘
                         │ Vectors
                         │
            ┌────────────▼────────────────┐
            │  10.0                       │
            │  Store in Knowledge Base    │
            │                             │
            └─────┬──────────────┬────────┘
                  │              │
         ┌────────▼──────┐  ┌────▼─────────┐
         │ D3: Policies  │  │ D2: VectorDB │
         └───────────────┘  └──────────────┘
```

---

## 9. User Stories

### Student User Stories

#### Epic 1: Policy Information Retrieval

**US-001: Ask Policy Question**
```
As a student,
I want to ask questions about university policies in natural language,
So that I can get quick answers without reading long handbooks.

Acceptance Criteria:
- Student can type question in chat interface
- Question is processed within 3 seconds
- Answer is displayed with confidence indicator
- Sources are cited with policy titles and page numbers
- Student can ask follow-up questions in same session

Priority: HIGH
Estimated Effort: 8 story points
```

**US-002: View Source Citations**
```
As a student,
I want to see which policies were used to generate the answer,
So that I can verify the information and read more if needed.

Acceptance Criteria:
- Each answer shows at least one source
- Source includes policy title, excerpt, and page number
- Student can click to view full policy document
- Sources are ranked by relevance

Priority: HIGH
Estimated Effort: 5 story points
```

**US-003: Understand Answer Confidence**
```
As a student,
I want to know how confident the AI is about its answer,
So that I can decide whether to contact admin for clarification.

Acceptance Criteria:
- Confidence displayed as HIGH/MEDIUM/LOW
- HIGH (>85% similarity): Green badge
- MEDIUM (75-85%): Yellow badge
- LOW (<75%): Red badge with admin contact suggestion
- Tooltip explains what confidence means

Priority: MEDIUM
Estimated Effort: 3 story points
```

**US-004: Use Quick Action Buttons**
```
As a busy student,
I want pre-filled question buttons for common queries,
So that I can get answers faster without typing.

Acceptance Criteria:
- At least 4 quick action buttons visible
- Buttons cover common topics (registration, fees, appeals)
- Clicking button fills input with question
- Student can edit question before sending

Priority: LOW
Estimated Effort: 2 story points
```

#### Epic 2: User Experience

**US-005: View Chat History**
```
As a student,
I want to see my previous questions and answers in the same session,
So that I can refer back without re-asking.

Acceptance Criteria:
- All messages persist during active session
- Scroll to see older messages
- Timestamps shown for each message
- Clear button to start fresh conversation

Priority: MEDIUM
Estimated Effort: 3 story points
```

**US-006: Rate Answer Helpfulness**
```
As a student,
I want to rate whether an answer was helpful,
So that the system can improve over time.

Acceptance Criteria:
- Thumbs up/down buttons below each answer
- Optional comment field for feedback
- Thank you message after submission
- Rating stored for analytics

Priority: LOW
Estimated Effort: 3 story points
```

**US-007: Access on Mobile Device**
```
As a student,
I want to use the chatbot on my phone,
So that I can get answers anytime, anywhere.

Acceptance Criteria:
- UI responsive on screens 320px and up
- Touch-friendly buttons (min 44px)
- Chat scrolls smoothly on mobile
- Virtual keyboard doesn't hide input

Priority: HIGH
Estimated Effort: 5 story points
```

---

### Administrator User Stories

#### Epic 3: Knowledge Base Management

**US-101: Upload Policy Document**
```
As an administrator,
I want to upload policy documents (PDF/DOCX) through the interface,
So that students can get answers from the latest policies.

Acceptance Criteria:
- Upload button accepts PDF and DOCX files (max 10MB)
- Progress bar shows upload status
- System parses document and extracts policies
- Success message shows number of policies extracted
- Document appears in policy library

Priority: HIGH
Estimated Effort: 8 story points
```

**US-102: Review Extracted Policies**
```
As an administrator,
I want to review automatically extracted policies before activation,
So that I can ensure accuracy.

Acceptance Criteria:
- List of extracted policies with titles and categories
- Preview shows full policy text
- Edit button to correct extracted content
- Approve/Reject buttons for each policy
- Only approved policies used for answers

Priority: MEDIUM
Estimated Effort: 8 story points
```

**US-103: Edit Policy Content**
```
As an administrator,
I want to manually edit policy text after upload,
So that I can correct parsing errors or update content.

Acceptance Criteria:
- Rich text editor for policy content
- Save button triggers re-embedding
- Version history tracks changes
- Notification to students if major update

Priority: MEDIUM
Estimated Effort: 5 story points
```

**US-104: Categorize Policies**
```
As an administrator,
I want to assign categories to policies (Academic, Financial, etc.),
So that students can filter by policy type.

Acceptance Criteria:
- Dropdown with 5 categories
- Bulk categorization for multiple policies
- Auto-categorization based on keywords
- Admin can override AI suggestion

Priority: LOW
Estimated Effort: 3 story points
```

#### Epic 4: Query Monitoring

**US-105: View Escalated Queries**
```
As an administrator,
I want to see all queries flagged as low confidence,
So that I can provide accurate manual responses.

Acceptance Criteria:
- Dashboard shows escalated queries list
- Filter by date, category, confidence
- Click to view full query and AI's attempted answer
- Respond button to provide correct answer
- Student gets notification of admin response

Priority: HIGH
Estimated Effort: 8 story points
```

**US-106: Override AI Response**
```
As an administrator,
I want to replace an AI-generated answer with my own,
So that students get correct information.

Acceptance Criteria:
- Edit button on any response
- Text editor to write correct answer
- "Send to student" button
- Original AI answer saved for comparison
- System learns from override (future enhancement)

Priority: HIGH
Estimated Effort: 5 story points
```

**US-107: View Query Analytics**
```
As an administrator,
I want to see statistics on common queries and answer accuracy,
So that I can identify problem areas.

Acceptance Criteria:
- Dashboard with charts (query volume, confidence distribution)
- Top 10 most asked questions
- Accuracy metrics (user ratings)
- Export to CSV for reporting

Priority: MEDIUM
Estimated Effort: 8 story points
```

---

### System User Stories

**US-201: Automatic Re-embedding on Policy Update**
```
As the system,
I need to automatically regenerate embeddings when a policy is edited,
So that semantic search remains accurate.

Acceptance Criteria:
- Detect policy content changes
- Trigger embedding generation in background
- Update vector database without downtime
- Log completion with timestamp
```

**US-202: Daily Analytics Aggregation**
```
As the system,
I need to calculate daily metrics every midnight,
So that dashboard loads quickly.

Acceptance Criteria:
- Cron job runs at 00:00 UTC
- Aggregates: total queries, avg confidence, escalation rate
- Stores in analytics table
- Alerts admin if escalation rate > 20%
```

---

## 10. Non-Functional Requirements

### Performance Requirements

| Requirement | Target | Measurement Method |
|-------------|--------|-------------------|
| Response Time | <3 seconds (90th percentile) | Application Performance Monitoring |
| Concurrent Users | 100+ simultaneous users | Load testing (k6, JMeter) |
| Uptime | 99% during business hours (8am-8pm) | Pingdom, StatusCake |
| Database Query Time | <500ms for policy retrieval | PostgreSQL query logs |
| Vector Search Time | <1 second for top-5 results | Pinecone metrics |
| API Throughput | 50 requests/second minimum | Load balancer metrics |

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Data Encryption** | - HTTPS/TLS 1.3 for all API calls<br>- AES-256 encryption for data at rest<br>- Encrypted backups |
| **Authentication** | - JWT tokens with 24h expiry<br>- Refresh token rotation<br>- Password hashing (bcrypt, 12 rounds) |
| **Authorization** | - Role-Based Access Control (RBAC)<br>- Student vs Admin permissions<br>- API rate limiting (100 req/min per IP) |
| **Data Privacy** | - NDPR (Nigeria Data Protection Regulation) compliance<br>- Anonymized analytics<br>- Student PII encrypted<br>- Right to data deletion |
| **API Security** | - CORS restricted to frontend domain<br>- Input validation (Zod schemas)<br>- SQL injection prevention (parameterized queries)<br>- XSS protection (sanitized output) |

### Scalability Requirements

| Aspect | Strategy |
|--------|----------|
| **Horizontal Scaling** | - Stateless API servers (can add more instances)<br>- Load balancer distributes traffic<br>- Docker containers for easy replication |
| **Database Scaling** | - Read replicas for PostgreSQL<br>- Connection pooling (max 100 connections)<br>- Indexed queries on common lookups |
| **Vector Database** | - Pinecone auto-scales<br>- Alternatively, FAISS sharded across nodes |
| **Caching** | - Redis cache for frequent queries<br>- TTL: 1 hour for policy data<br>- CDN for static frontend assets |

### Usability Requirements

| Requirement | Standard |
|-------------|----------|
| **Accessibility** | - WCAG 2.1 Level AA compliance<br>- Screen reader compatible<br>- Keyboard navigation<br>- High contrast mode<br>- Minimum font size: 14px |
| **Mobile Responsiveness** | - Responsive design (320px to 2560px)<br>- Touch targets ≥44x44px<br>- No horizontal scrolling |
| **Language** | - English (primary)<br>- Future: Hausa, Yoruba, Igbo support |
| **Learning Curve** | - First-time users can ask question within 30 seconds<br>- No training required<br>- Onboarding tutorial (optional) |

### Reliability Requirements

| Requirement | Target |
|-------------|--------|
| **Mean Time Between Failures (MTBF)** | >720 hours (30 days) |
| **Mean Time To Recovery (MTTR)** | <1 hour for critical issues |
| **Error Handling** | - Graceful degradation (show cached results if AI fails)<br>- User-friendly error messages<br>- Automatic retry for transient failures |
| **Data Backup** | - Daily automated backups<br>- 30-day retention<br>- Point-in-time recovery |
| **Monitoring** | - Sentry for error tracking<br>- CloudWatch/Datadog for metrics<br>- PagerDuty alerts for critical failures |

### Maintainability Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Code Quality** | - TypeScript strict mode<br>- ESLint + Prettier<br>- Test coverage >80%<br>- Code review required for merges |
| **Documentation** | - API docs (OpenAPI/Swagger)<br>- Architecture diagrams (this document)<br>- Inline code comments<br>- README with setup instructions |
| **Modularity** | - Clean Architecture (layers: Controllers, Services, Repositories)<br>- Dependency injection<br>- Service interfaces for mocking |
| **Logging** | - Structured JSON logs<br>- Log levels (ERROR, WARN, INFO, DEBUG)<br>- Centralized log aggregation (ELK stack) |

### Compatibility Requirements

| Platform | Support |
|----------|---------|
| **Browsers** | - Chrome 90+<br>- Firefox 88+<br>- Safari 14+<br>- Edge 90+ |
| **Devices** | - Desktop (Windows, macOS, Linux)<br>- Mobile (iOS 13+, Android 9+)<br>- Tablets |
| **Screen Sizes** | - 320px (mobile) to 3840px (4K desktop) |

---

## Architecture Decision Records (ADRs)

### ADR-001: Use PostgreSQL AND Vector Database

**Status:** Accepted  
**Date:** 2026-01-29

**Context:**
System needs to store both structured data (students, queries, feedback) and unstructured semantic embeddings (policy vectors).

**Decision:**
Use **PostgreSQL** for transactional data and **Pinecone/FAISS** for vector embeddings.

**Rationale:**
- PostgreSQL: ACID compliance, complex queries, relationships
- Vector DB: Optimized for high-dimensional similarity search
- Alternative considered: pgvector extension for PostgreSQL (rejected due to performance limits at scale)

**Consequences:**
- Two databases to manage
- Slightly more complex deployment
- Better performance for each use case

---

### ADR-002: Use RAG Instead of Fine-Tuning

**Status:** Accepted  
**Date:** 2026-01-29

**Context:**
Need AI to answer policy questions accurately using university-specific documents.

**Decision:**
Use **Retrieval-Augmented Generation (RAG)** with OpenAI GPT-4.

**Rationale:**
- Fine-tuning: Expensive ($500-1000), slow to update, risk of hallucination
- RAG: Dynamic knowledge base, easy updates, cites sources, cheaper ($0.14 per 1000 queries)

**Consequences:**
- Requires vector database infrastructure
- Slight latency increase (search + generation)
- Better accuracy and transparency

---

### ADR-003: Use OpenAI Over Open-Source LLMs

**Status:** Accepted (Pilot Phase)  
**Date:** 2026-01-29

**Context:**
Need LLM for answer generation. OpenAI (paid) vs Llama 2 (free, self-hosted).

**Decision:**
Use **OpenAI GPT-4o-mini** for initial implementation.

**Rationale:**
- OpenAI: Better quality, no infrastructure cost, fast deployment
- Llama 2: Requires GPU servers, lower quality, complex setup
- Cost for pilot (2000 queries): ~$0.30 (negligible)

**Consequences:**
- Vendor lock-in (mitigated by future migration plan)
- Ongoing API costs (acceptable for MSc pilot)
- Faster time to market

---

## Appendices

### Appendix A: Database Table Definitions (SQL)

```sql
-- Students Table
CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    matric_number VARCHAR(50) UNIQUE NOT NULL,
    program VARCHAR(100),
    year INTEGER CHECK (year BETWEEN 1 AND 7),
    level VARCHAR(10),
    cgpa DECIMAL(3,2) CHECK (cgpa >= 0 AND cgpa <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy Documents Table
CREATE TABLE policies (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ACADEMIC', 'FINANCIAL', 'ADMINISTRATIVE', 'STUDENT_AFFAIRS', 'EXAMINATION')),
    content TEXT NOT NULL,
    summary TEXT,
    institution VARCHAR(255),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    source_file VARCHAR(255),
    page_reference VARCHAR(50),
    created_by UUID REFERENCES administrators(admin_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy Queries Table
CREATE TABLE queries (
    query_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id),
    query_text TEXT NOT NULL,
    session_id UUID,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Policy Responses Table
CREATE TABLE responses (
    response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES queries(query_id),
    answer_text TEXT NOT NULL,
    confidence VARCHAR(10) CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
    reasoning TEXT,
    escalated BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms INTEGER
);

-- User Feedback Table
CREATE TABLE feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(response_id),
    student_id UUID REFERENCES students(student_id),
    helpful BOOLEAN,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_queries_student ON queries(student_id);
CREATE INDEX idx_queries_timestamp ON queries(timestamp DESC);
CREATE INDEX idx_responses_query ON responses(query_id);
CREATE INDEX idx_responses_escalated ON responses(escalated) WHERE escalated = TRUE;
CREATE INDEX idx_policies_category ON policies(category);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_feedback_response ON feedback(response_id);
```

---

## End of Document

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Author:** Ediomo Titus  
**Supervisor:** Dr. Mustapha Aminu Bagiwa  
**Institution:** Veritas University Abuja

---

**Note for Submission:**
This document contains all standard UML diagrams expected for MSc software engineering projects:
1. ✅ System Architecture Diagram
2. ✅ Entity-Relationship Diagram (Database Schema)
3. ✅ Use Case Diagram
4. ✅ Sequence Diagrams (3 scenarios)
5. ✅ Class Diagram
6. ✅ Component Diagram
7. ✅ Deployment Diagram
8. ✅ Data Flow Diagram (DFD Levels 0 & 1)
9. ✅ User Stories (Agile Format)
10. ✅ Non-Functional Requirements

Additional materials included:
- Architecture Decision Records (ADRs)
- SQL schema definitions
- Performance benchmarks
- Security specifications

**Ready for academic submission! 🎓**
