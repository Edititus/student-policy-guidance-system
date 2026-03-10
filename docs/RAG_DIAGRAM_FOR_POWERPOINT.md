# RAG Architecture Diagram - PowerPoint Version
## Veritas University Policy Guidance System

---

## SLIDE 1: High-Level RAG Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    VERITAS RAG SYSTEM ARCHITECTURE                      │
│                   AI-Based Student Policy Guidance                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


    ┌──────────────┐
    │  Admin       │
    │  Uploads     │
    │  Policy PDF  │
    └──────┬───────┘
           │
           ▼
    ╔══════════════════╗
    ║   INDEXING       ║  ←── Parse → Chunk → Embed → Store
    ║   PHASE          ║
    ╚═════════┬════════╝
              │
              │  Policy chunks stored as vectors
              │
              ▼
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║              VECTOR DATABASE                             ║
    ║         (1536-dimensional embeddings)                    ║
    ║                                                          ║
    ║  [Policy Chunk 1] → [0.12, -0.43, 0.87, ..., 0.21]     ║
    ║  [Policy Chunk 2] → [0.31, 0.22, -0.15, ..., 0.44]     ║
    ║  [Policy Chunk 3] → [-0.05, 0.67, 0.44, ..., -0.12]    ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
              │
              │  Semantic Search
              │
              ▼
    ┌──────────────┐
    │  Student     │
    │  Asks        │───────┐
    │  Question    │       │
    └──────────────┘       │
                           │
                           ▼
                    ╔══════════════════╗
                    ║   RETRIEVAL      ║  ←── Embed query → Find similar
                    ║   PHASE          ║
                    ╚═════════┬════════╝
                              │
                              │  Top 5 relevant chunks
                              │
                              ▼
                    ╔══════════════════╗
                    ║   GENERATION     ║  ←── Context + Query → GPT
                    ║   PHASE          ║
                    ╚═════════┬════════╝
                              │
                              │  AI-generated answer
                              │
                              ▼
                    ┌──────────────────┐
                    │  Student Gets    │
                    │  Answer with     │
                    │  Policy Sources  │
                    └──────────────────┘
```

---

## SLIDE 2: Detailed RAG Flow (3 Phases)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                          PHASE 1: INDEXING                               ║
╚══════════════════════════════════════════════════════════════════════════╝

    Policy Document (PDF)
          ↓
    [Parse & Extract Text]
          ↓
    [Chunk into 1000 chars]  ← Overlap: 200 chars
          ↓
    [Generate Embeddings]    ← OpenAI text-embedding-3-small
          ↓
    [Store in Vector DB]     ← 1536-dimensional vectors


╔══════════════════════════════════════════════════════════════════════════╗
║                         PHASE 2: RETRIEVAL                               ║
╚══════════════════════════════════════════════════════════════════════════╝

    Student Query: "What is the late registration fee?"
          ↓
    [Embed Query]            ← Convert to vector
          ↓
    [Semantic Search]        ← Cosine similarity
          ↓
    Top 5 Chunks (>0.7 similarity)
          ↓
    Relevant Policy Context


╔══════════════════════════════════════════════════════════════════════════╗
║                         PHASE 3: GENERATION                              ║
╚══════════════════════════════════════════════════════════════════════════╝

    Query + Context
          ↓
    [GPT-4o-mini Generation]  ← Temperature: 0.3
          ↓
    [Confidence Scoring]      ← Based on similarity scores
          ↓
    Answer + Sources + Confidence Badge
          ↓
    Display to Student
```

---

## SLIDE 3: System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────────┐      ┌──────────────┐      ┌─────────────┐         │
│   │   FRONTEND  │      │   BACKEND    │      │   AI LAYER  │         │
│   │             │      │              │      │             │         │
│   │  React UI   │ ───► │  Express API │ ───► │  OpenAI GPT │         │
│   │  Chatbot    │      │  Controllers │      │  Embeddings │         │
│   │             │      │  RAG Service │      │             │         │
│   └─────────────┘      └──────┬───────┘      └─────────────┘         │
│                               │                                        │
│                               ▼                                        │
│                        ┌──────────────┐                               │
│                        │   DATABASE   │                               │
│                        │              │                               │
│                        │  PostgreSQL  │                               │
│                        │  + pgvector  │                               │
│                        └──────────────┘                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SLIDE 4: RAG vs Traditional Search

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   TRADITIONAL KEYWORD SEARCH          │         RAG APPROACH            │
│                                       │                                 │
│   Query: "late fee"                   │   Query: "late fee"             │
│        ↓                              │        ↓                        │
│   Exact word matching                 │   Semantic understanding        │
│        ↓                              │        ↓                        │
│   Finds: "late" AND "fee"             │   Finds: "late registration",   │
│         in documents                  │         "penalty", "overdue",   │
│        ↓                              │         "delayed enrollment"    │
│   Returns: Document list              │        ↓                        │
│   No answer synthesis                 │   AI generates contextual       │
│                                       │   answer with sources           │
│   ❌ Can't handle synonyms            │   ✅ Understands intent         │
│   ❌ No context awareness             │   ✅ Context-aware              │
│   ❌ Just retrieves documents         │   ✅ Generates natural answers  │
│                                       │                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SLIDE 5: Confidence Scoring & Escalation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONFIDENCE SCORING SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────┘


    Student Query
         ↓
    [Retrieve Top 5 Chunks]
         ↓
    Calculate Average Similarity Score
         ↓
    ┌────────────────────────────────────────┐
    │                                        │
    │  Avg Similarity >= 0.85                │ ──► ✅ HIGH Confidence
    │  Show answer immediately               │     (85%+ of queries)
    │                                        │
    ├────────────────────────────────────────┤
    │                                        │
    │  0.70 <= Avg Similarity < 0.85         │ ──► ⚠️ MEDIUM Confidence
    │  Show answer with caution badge        │     (10% of queries)
    │                                        │
    ├────────────────────────────────────────┤
    │                                        │
    │  Avg Similarity < 0.70                 │ ──► ⚡ LOW Confidence
    │  Escalate to Admin Dashboard           │     (5% of queries)
    │                                        │
    └────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Admin Reviews   │
                  │ Provides Correct│
                  │ Answer          │
                  └─────────────────┘
```

---

## SLIDE 6: Technical Specifications

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      KEY TECHNICAL DETAILS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🤖 MODELS                                                              │
│     • Embedding:  text-embedding-3-small (1536 dimensions)              │
│     • Generation: gpt-4o-mini                                           │
│                                                                         │
│  📐 CHUNKING                                                            │
│     • Size:       1000 characters per chunk                             │
│     • Overlap:    200 characters (preserve context)                     │
│                                                                         │
│  🔍 RETRIEVAL                                                           │
│     • Algorithm:  Cosine Similarity                                     │
│     • Top K:      5 most relevant chunks                                │
│     • Threshold:  0.7 minimum similarity                                │
│                                                                         │
│  ⚡ PERFORMANCE                                                         │
│     • Response Time:    < 3 seconds                                     │
│     • Cost per Query:   ~$0.0001                                        │
│     • Accuracy Target:  > 90% for high-confidence queries               │
│                                                                         │
│  💾 STORAGE                                                             │
│     • Current:  In-memory (development)                                 │
│     • Future:   PostgreSQL + pgvector extension                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SLIDE 7: System Architecture Overview

```
                        VERITAS RAG SYSTEM ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            👨‍🎓 STUDENT                                   │
│                               │                                         │
│                               │ asks question                           │
│                               ▼                                         │
│                    ┌────────────────────┐                              │
│                    │   REACT FRONTEND   │                              │
│                    │   (Chatbot UI)     │                              │
│                    └─────────┬──────────┘                              │
│                              │ API call                                 │
│                              ▼                                          │
│                    ┌────────────────────┐                              │
│                    │  EXPRESS BACKEND   │                              │
│                    │                    │                              │
│                    │  • Auth Middleware │                              │
│                    │  • Chat Controller │                              │
│                    │  • RAG Service     │                              │
│                    └─────────┬──────────┘                              │
│                              │                                          │
│           ┌──────────────────┼──────────────────┐                      │
│           │                  │                  │                      │
│           ▼                  ▼                  ▼                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  EMBEDDING   │  │    VECTOR    │  │   OPENAI     │                │
│  │  SERVICE     │  │   DATABASE   │  │   GPT-4o     │                │
│  │              │  │              │  │              │                │
│  │ Generate     │  │ Store &      │  │ Generate     │                │
│  │ embeddings   │  │ search       │  │ answers      │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                         │
│                              ▲                                          │
│                              │ uploads policies                         │
│                              │                                          │
│                    ┌────────────────────┐                              │
│                    │  ADMIN DASHBOARD   │                              │
│                    │                    │                              │
│                    │  • Policy Upload   │                              │
│                    │  • Escalations     │                              │
│                    │  • Analytics       │                              │
│                    └────────────────────┘                              │
│                              ▲                                          │
│                              │                                          │
│                            👨‍💼 ADMIN                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SLIDE 8: Data Flow Diagram

```
                          DATA FLOW - STUDENT QUERY


  1. STUDENT INPUT                    2. QUERY PROCESSING
  ┌──────────────┐                   ┌──────────────────┐
  │ "What is the │                   │  • Validate      │
  │  late reg    │ ────────────────► │  • Authenticate  │
  │  fee?"       │                   │  • Parse intent  │
  └──────────────┘                   └────────┬─────────┘
                                              │
                                              ▼
  4. GENERATE ANSWER                 3. SEMANTIC SEARCH
  ┌──────────────────┐               ┌──────────────────┐
  │  • Context +     │               │  • Embed query   │
  │    Query         │               │  • Find similar  │
  │  • GPT generates │ ◄──────────── │  • Retrieve top  │
  │    natural answer│               │    5 chunks      │
  └────────┬─────────┘               └──────────────────┘
           │
           ▼
  5. RETURN RESPONSE
  ┌──────────────────────────────┐
  │ {                            │
  │   answer: "The late...",     │
  │   confidence: "HIGH",        │
  │   sources: [...],            │
  │   policyRefs: [...]          │
  │ }                            │
  └────────┬─────────────────────┘
           │
           ▼
  6. DISPLAY TO STUDENT
  ┌──────────────────┐
  │ ✅ Answer shown  │
  │ 📚 Sources cited │
  │ 👍👎 Feedback    │
  └──────────────────┘
```

---

## SLIDE 9: Performance Metrics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SYSTEM PERFORMANCE METRICS                         │
└─────────────────────────────────────────────────────────────────────────┘


    ⏱️  RESPONSE TIME BREAKDOWN

    ┌─────────────────────────────────────────────┐
    │                                             │
    │  Query Embedding        ░░░ 200ms          │
    │                                             │
    │  Vector Search          ░ 50ms              │
    │                                             │
    │  LLM Generation         ░░░░░░ 1-2 sec     │
    │                                             │
    │  ─────────────────────────────────────────  │
    │  TOTAL:                 < 3 seconds         │
    │                                             │
    └─────────────────────────────────────────────┘


    💰 COST ANALYSIS

    ┌─────────────────────────────────────────────┐
    │  Per Query:           $0.0001               │
    │  Per 1,000 Queries:   $0.10                 │
    │  Per 10,000 Users:    ~$50/month            │
    │  (assuming 5 queries/user/month)            │
    └─────────────────────────────────────────────┘


    🎯 ACCURACY TARGETS

    ┌─────────────────────────────────────────────┐
    │  High Confidence:     > 90% accuracy        │
    │  Escalation Rate:     < 10% of queries      │
    │  User Satisfaction:   > 4.0/5.0             │
    └─────────────────────────────────────────────┘
```

---

## SLIDE 10: Benefits & Impact

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHY RAG FOR POLICY GUIDANCE?                         │
└─────────────────────────────────────────────────────────────────────────┘

  ✅ STUDENT BENEFITS                 ✅ UNIVERSITY BENEFITS
  
  • 24/7 instant answers              • Reduce admin workload
  • No waiting for staff              • Consistent information
  • Natural language queries          • Track common questions
  • Context-aware responses           • Improve policy clarity
  • Mobile-friendly access            • Data-driven decisions
  • Multi-language support            • Cost-effective scaling
  

  📊 EXPECTED IMPACT
  
  ┌────────────────────────────────────────────────────────────────┐
  │                                                                │
  │  Before RAG:                    After RAG:                     │
  │                                                                │
  │  • Email response: 24-48 hrs    • Instant response: < 3 secs  │
  │  • Office hours only            • Available 24/7              │
  │  • Inconsistent answers         • Consistent & accurate       │
  │  • Staff overwhelmed            • Staff focus on complex      │
  │                                   cases only                  │
  │  • Limited to working hours     • Accessible anytime,         │
  │                                   anywhere                    │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

---

## SLIDE 11: Future Enhancements

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP & ENHANCEMENTS                          │
└─────────────────────────────────────────────────────────────────────────┘


  ✅ COMPLETED (Phase 1 & 2)
  
  • Basic RAG pipeline with semantic search
  • Student chatbot interface
  • Admin dashboard with escalation management
  • JWT authentication & authorization
  • Multi-format document parsing (PDF, DOCX, TXT)


  🔄 IN PROGRESS (Phase 2 - Current)
  
  • Database integration (PostgreSQL + pgvector)
  • Real-time analytics dashboard
  • Policy versioning and update tracking


  🔮 PLANNED (Phase 3)
  
  • Hybrid RAG + Rule-based inference engine
  • Multi-language support (English + Pidgin)
  • Conversation memory and follow-up questions
  • Mobile app (iOS & Android)
  • Integration with university portal
  • Automated policy update detection
  • Advanced analytics and reporting
  • A/B testing for prompt optimization
```

---

## BONUS: Simple 1-Slide Summary

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║              VERITAS RAG SYSTEM - ONE-SLIDE OVERVIEW                  ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝


         📄 POLICY DOCUMENTS        →    🤖 AI PROCESSING
                                         
         • Student Handbook                • Parse & chunk text
         • Academic Regulations            • Generate embeddings
         • Fee Policies                    • Store in vector DB
         • Exam Guidelines                 • Enable semantic search


                            ↓


         👨‍🎓 STUDENT ASKS              ←    💬 NATURAL LANGUAGE
                                         
         "What is the late                 "How do I defer exams?"
          registration fee?"               "What's the CGPA for
                                            first class honors?"


                            ↓


         🔍 RETRIEVAL                 →    🎯 GENERATION
                                         
         • Semantic search                 • GPT-4o generates
         • Find relevant chunks             contextual answer
         • Rank by similarity              • Cites policy sources
         • Top 5 most relevant             • Confidence scoring


                            ↓


         ✅ INSTANT ANSWER            ←    📊 WITH SOURCES
                                         
         "The late registration fee        Sources:
          is ₦10,000 according to          • Academic Regs (§3.2)
          Section 3.2 of Academic          • Student Handbook
          Regulations..."                    (p. 45)
                                          
                                          Confidence: HIGH (92%)


─────────────────────────────────────────────────────────────────────────

   ⚡ < 3 sec response  |  💰 $0.0001/query  |  🎯 >90% accuracy

─────────────────────────────────────────────────────────────────────────
