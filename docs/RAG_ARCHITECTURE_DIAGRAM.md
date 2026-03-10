# RAG Architecture - Veritas Policy Guidance System

## Complete RAG Pipeline Visualization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        VERITAS RAG SYSTEM - DEEP DIVE                           │
│                    AI-Based Student Policy Guidance System                      │
└─────────────────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         PHASE 1: INDEXING PIPELINE                            ║
║                        (Admin uploads policy documents)                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    ┌──────────────┐
    │   Admin UI   │
    │ Policy Upload│
    └──────┬───────┘
           │ PDF/DOCX/TXT
           │ (Student Handbook,
           │  Fee Policy, etc.)
           ▼
    ┌──────────────────────┐
    │ PolicyParserService  │────┐
    │  - PDF: pdf-parse    │    │
    │  - DOCX: mammoth.js  │    │ Parse & Extract
    │  - TXT: fs.readFile  │    │ Raw Text
    └──────┬───────────────┘    │
           │ Raw Text            │
           │ "Students must..."  │
           ▼                     ▼
    ┌────────────────────────────────┐
    │   Text Preprocessing           │
    │   - Remove headers/footers     │
    │   - Clean whitespace           │
    │   - Normalize formatting       │
    └────────┬───────────────────────┘
             │ Cleaned Text
             │
             ▼
    ┌────────────────────────────────┐
    │      Chunking Strategy         │
    │                                │
    │  chunkText(text,               │
    │    chunkSize=1000,             │
    │    overlap=200)                │
    │                                │
    │  Input: Long policy document   │
    │  Output: Overlapping chunks    │
    └────────┬───────────────────────┘
             │ ["Chunk 1: Academic...",
             │  "Chunk 2: probation...",
             │  "Chunk 3: fees..."]
             │
             ▼
    ╔════════════════════════════════╗
    ║   Embedding Model (OpenAI)     ║
    ║                                ║
    ║  text-embedding-3-small        ║
    ║  Dimension: 1536               ║
    ║                                ║
    ║  Input: Text string            ║
    ║  Output: Vector [0.12, -0.43,  ║
    ║          0.87, ..., 0.21]      ║
    ╚════════┬═══════════════════════╝
             │ Generate embeddings
             │ for each chunk
             │
             ▼
    ┌─────────────────────────────────────────┐
    │       Vector Representations            │
    │                                         │
    │  Chunk 1 → [0.12, -0.43, 0.87, ...]    │
    │  Chunk 2 → [0.31, 0.22, -0.15, ...]    │
    │  Chunk 3 → [-0.05, 0.67, 0.44, ...]    │
    └─────────┬───────────────────────────────┘
              │ Store with metadata
              │
              ▼
    ╔═════════════════════════════════════════╗
    ║      Vector Store (In-Memory)           ║
    ║                                         ║
    ║  policyEmbeddings: PolicyEmbedding[]    ║
    ║                                         ║
    ║  interface PolicyEmbedding {            ║
    ║    policyId: string                     ║
    ║    chunkText: string                    ║
    ║    embedding: number[] // 1536-dim      ║
    ║    chunkIndex: number                   ║
    ║    similarity?: number                  ║
    ║  }                                      ║
    ║                                         ║
    ║  Future: PostgreSQL + pgvector          ║
    ║          or Pinecone/Weaviate           ║
    ╚═════════════════════════════════════════╝
              │
              │ Indexed & Ready
              │ for Semantic Search
              ▼
         [Waiting for
          student queries]


╔═══════════════════════════════════════════════════════════════════════════════╗
║                      PHASE 2: RETRIEVAL PIPELINE                              ║
║                        (Student asks a question)                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    ┌──────────────┐
    │   Student    │
    │     User     │
    └──────┬───────┘
           │ Types question:
           │ "What is the fee
           │  for late registration?"
           ▼
    ┌────────────────────────────────┐
    │    Frontend (React)            │
    │    PolicyChatbot Component     │
    │                                │
    │  - Input validation            │
    │  - Rate limiting               │
    │  - Context: {                  │
    │      studentId,                │
    │      department,               │
    │      level                     │
    │    }                           │
    └────────┬───────────────────────┘
             │ POST /api/chat/query
             │ { query: "...",
             │   studentContext: {...} }
             ▼
    ┌────────────────────────────────┐
    │    Backend API                 │
    │    ChatController              │
    │    (with JWT auth)             │
    └────────┬───────────────────────┘
             │ Forward to RAGService
             │
             ▼
    ╔════════════════════════════════════════════════════════╗
    ║              RAGService.answerQuery()                  ║
    ║                                                        ║
    ║  Step 1: VECTORIZE QUERY                               ║
    ╚════════════════════════════════════════════════════════╝
             │
             │ "What is the fee
             │  for late registration?"
             ▼
    ╔════════════════════════════════╗
    ║   Embedding Model (OpenAI)     ║
    ║                                ║
    ║  text-embedding-3-small        ║
    ║                                ║
    ║  Query → Vector [0.23, -0.11,  ║
    ║          0.56, ..., -0.33]     ║
    ╚════════┬═══════════════════════╝
             │ Query embedding
             │
             ▼
    ╔════════════════════════════════════════════════════════╗
    ║  Step 2: SEMANTIC SEARCH (Cosine Similarity)           ║
    ║                                                        ║
    ║  embeddingService.searchSimilar(                       ║
    ║    queryText,                                          ║
    ║    policyEmbeddings,                                   ║
    ║    topK = 5,                                           ║
    ║    minSimilarity = 0.7                                 ║
    ║  )                                                     ║
    ║                                                        ║
    ║  Algorithm: Cosine Similarity                          ║
    ║  similarity = (A · B) / (||A|| × ||B||)                ║
    ║                                                        ║
    ║  Compare query vector with all stored vectors          ║
    ╚════════┬═══════════════════════════════════════════════╝
             │
             │ Search results ranked
             │ by similarity score
             ▼
    ┌─────────────────────────────────────────────────┐
    │     Top 5 Most Relevant Chunks                  │
    │                                                 │
    │  1. "Late registration fee: ₦10,000..."        │
    │     Similarity: 0.94                            │
    │                                                 │
    │  2. "Registration deadlines and penalties..."   │
    │     Similarity: 0.87                            │
    │                                                 │
    │  3. "Fee waivers for medical emergencies..."    │
    │     Similarity: 0.81                            │
    │                                                 │
    │  4. "Payment methods and procedures..."         │
    │     Similarity: 0.76                            │
    │                                                 │
    │  5. "General fee structure for..."              │
    │     Similarity: 0.72                            │
    └─────────┬───────────────────────────────────────┘
              │ Pass to LLM as context
              │
              ▼
    ╔════════════════════════════════════════════════════════╗
    ║  Step 3: AUGMENT PROMPT WITH CONTEXT                   ║
    ╚════════════════════════════════════════════════════════╝
              │
              │ Build enriched prompt
              ▼
    ┌──────────────────────────────────────────────────┐
    │         Prompt Engineering                       │
    │                                                  │
    │  System Prompt:                                  │
    │  "You are Veritas University policy assistant.  │
    │   Answer based ONLY on the context provided.    │
    │   Be specific, accurate, cite policies.          │
    │   If unsure, say 'I need clarification.'"       │
    │                                                  │
    │  User Prompt:                                    │
    │  "Context from policies:                         │
    │   [Top 5 chunks concatenated]                    │
    │                                                  │
    │   Student Context:                               │
    │   - Department: Computer Science                 │
    │   - Level: 300                                   │
    │                                                  │
    │   Question: What is the fee for late             │
    │   registration?                                  │
    │                                                  │
    │   Provide accurate answer with policy ref."      │
    └──────────┬───────────────────────────────────────┘
               │
               ▼


╔═══════════════════════════════════════════════════════════════════════════════╗
║                      PHASE 3: GENERATION PIPELINE                             ║
║                        (LLM generates answer)                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    ╔════════════════════════════════════════════════════════╗
    ║              OpenAI GPT-4o-mini                        ║
    ║                                                        ║
    ║  Model: gpt-4o-mini                                    ║
    ║  Temperature: 0.3 (factual, less creative)             ║
    ║  Max Tokens: 500                                       ║
    ║                                                        ║
    ║  Process:                                              ║
    ║  1. Analyze query intent                               ║
    ║  2. Cross-reference with context chunks                ║
    ║  3. Generate coherent answer                           ║
    ║  4. Cite relevant policy sections                      ║
    ╚════════┬═══════════════════════════════════════════════╝
             │
             │ AI-generated response
             ▼
    ┌──────────────────────────────────────────────────┐
    │         Generated Answer                         │
    │                                                  │
    │  "According to Veritas University's Academic     │
    │   Regulations (Section 3.2), the late            │
    │   registration fee is ₦10,000 for students       │
    │   who register after the deadline.               │
    │                                                  │
    │   However, students with documented medical      │
    │   emergencies may apply for a fee waiver         │
    │   through the Student Affairs Office.            │
    │                                                  │
    │   Payment can be made via bank transfer,         │
    │   debit card, or at the bursary office."         │
    └──────────┬───────────────────────────────────────┘
               │
               ▼
    ╔════════════════════════════════════════════════════════╗
    ║  Step 4: CONFIDENCE SCORING & ESCALATION               ║
    ║                                                        ║
    ║  Algorithm:                                            ║
    ║  avgSimilarity = mean(top 5 similarity scores)         ║
    ║                                                        ║
    ║  If avgSimilarity >= 0.85: HIGH confidence            ║
    ║  If 0.70 <= avgSimilarity < 0.85: MEDIUM              ║
    ║  If avgSimilarity < 0.70: LOW → Escalate to admin     ║
    ║                                                        ║
    ║  needsEscalation = (confidence === 'LOW')             ║
    ╚════════┬═══════════════════════════════════════════════╝
             │
             │ Current query:
             │ Avg similarity = 0.82
             │ Confidence = MEDIUM
             ▼
    ┌──────────────────────────────────────────────────┐
    │        Response Object                           │
    │                                                  │
    │  {                                               │
    │    queryId: "uuid-12345",                        │
    │    query: "What is the fee...",                  │
    │    answer: "According to...",                    │
    │    confidence: "MEDIUM",                         │
    │    sources: [                                    │
    │      {                                           │
    │        policyId: "academic-regs-2024",           │
    │        title: "Academic Regulations",            │
    │        section: "3.2 Registration",              │
    │        excerpt: "Late registration fee..."       │
    │      }                                           │
    │    ],                                            │
    │    needsEscalation: false,                       │
    │    timestamp: "2026-02-04T10:30:00Z"             │
    │  }                                               │
    └──────────┬───────────────────────────────────────┘
               │
               ▼
    ┌────────────────────────────────┐
    │    Backend Response            │
    │    HTTP 200 OK                 │
    └────────┬───────────────────────┘
             │ JSON response
             │
             ▼
    ┌────────────────────────────────┐
    │    Frontend Display            │
    │    PolicyChatbot               │
    │                                │
    │  Shows:                        │
    │  - Answer text                 │
    │  - Confidence badge            │
    │  - Source policy links         │
    │  - Feedback buttons (👍 👎)    │
    └────────┬───────────────────────┘
             │
             ▼
    ┌──────────────┐
    │   Student    │
    │  Reads Answer│
    └──────────────┘


╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ESCALATION FLOW (LOW CONFIDENCE)                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    If avgSimilarity < 0.70:
    
    ┌──────────────────────────────────┐
    │   RAGService detects             │
    │   LOW confidence                 │
    └──────────┬───────────────────────┘
               │
               │ needsEscalation = true
               ▼
    ┌──────────────────────────────────┐
    │   Save to escalatedQueries[]     │
    │   in AdminController             │
    └──────────┬───────────────────────┘
               │
               │ Notify admin
               ▼
    ┌──────────────────────────────────┐
    │   Admin Dashboard                │
    │   "Escalated Queries" Tab        │
    │                                  │
    │   Shows:                         │
    │   - Original question            │
    │   - Auto-generated answer        │
    │   - Confidence score             │
    │   - Student context              │
    │   - "Respond" button             │
    └──────────┬───────────────────────┘
               │
               │ Admin reviews
               ▼
    ┌──────────────────────────────────┐
    │   Admin provides correct answer  │
    │   via response modal             │
    └──────────┬───────────────────────┘
               │
               │ POST /api/admin/queries/:id/respond
               ▼
    ┌──────────────────────────────────┐
    │   System updates:                │
    │   - Marks query as reviewed      │
    │   - Stores correct answer        │
    │   - Notifies student (future)    │
    │   - Retrains model (future)      │
    └──────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         TECHNICAL SPECIFICATIONS                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│  EMBEDDING MODEL                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Model: text-embedding-3-small (OpenAI)                                 │
│  Dimensions: 1536                                                       │
│  Cost: $0.02 per 1M tokens                                              │
│  Speed: ~3000 tokens/sec                                                │
│  Use Case: Balance cost/performance for student queries                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GENERATION MODEL                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Model: gpt-4o-mini                                                     │
│  Context: 128K tokens                                                   │
│  Output: 500 tokens max                                                 │
│  Temperature: 0.3 (factual responses)                                   │
│  Cost: $0.15 per 1M input tokens, $0.60 per 1M output                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CHUNKING STRATEGY                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Chunk Size: 1000 characters                                            │
│  Overlap: 200 characters                                                │
│  Reasoning: Preserve context across chunk boundaries                    │
│  Example: "...end of chunk 1 [overlap] start of chunk 2..."            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SIMILARITY SEARCH                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Algorithm: Cosine Similarity                                           │
│  Formula: cos(θ) = (A · B) / (||A|| × ||B||)                            │
│  Range: [-1, 1] where 1 = identical, 0 = orthogonal, -1 = opposite     │
│  Threshold: 0.7 minimum similarity                                      │
│  Top K: 5 most relevant chunks                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CONFIDENCE THRESHOLDS                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  HIGH:   avgSimilarity >= 0.85  → Show answer immediately              │
│  MEDIUM: 0.70 <= avgSimilarity < 0.85 → Show with caution badge        │
│  LOW:    avgSimilarity < 0.70   → Escalate to admin review             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  STORAGE (Current: In-Memory)                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Current: policyEmbeddings: PolicyEmbedding[] in RAM                    │
│  Limitation: Lost on server restart                                     │
│  Future:                                                                │
│    - PostgreSQL with pgvector extension for hybrid search              │
│    - Pinecone/Weaviate for production-scale vector search              │
│    - Redis for query caching                                            │
└─────────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         DATA FLOW SUMMARY                                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    INDEXING:   Policy PDF → Parse → Chunk → Embed → Store in Vector DB
                (~2 minutes per 50-page policy document)

    RETRIEVAL:  Student Query → Embed → Search → Retrieve Top 5 Chunks
                (~200ms including embedding + search)

    GENERATION: Context + Query → GPT-4o-mini → Answer + Confidence
                (~1-2 seconds for 500 token response)

    TOTAL LATENCY: ~2.5 seconds from query submission to answer display


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         KEY FILES IN CODEBASE                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    /apps/backend/src/services/ragService.ts
    └─ Main RAG orchestration (answerQuery, addPolicy, buildContext)

    /apps/backend/src/services/embeddingService.ts
    └─ Embedding generation and similarity search (searchSimilar, embedText)

    /apps/backend/src/services/policyParserService.ts
    └─ Document parsing and chunking (parsePDF, parseDocx, chunkText)

    /apps/backend/src/controllers/chatController.ts
    └─ API endpoint handlers (handleQuery, getFeedback)

    /apps/backend/src/models/Policy.ts
    └─ TypeScript interfaces (PolicyEmbedding, PolicyResponse)

    /apps/frontend/src/components/PolicyChatbot.tsx
    └─ React UI for student queries


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         PERFORMANCE METRICS                                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    Query Response Time:        < 3 seconds (target)
    Embedding Generation:       ~200ms per query
    Vector Search:              ~50ms for 1000 chunks
    LLM Response:               ~1-2 seconds
    
    Cost Per Query:             ~$0.0001 (embedding + generation)
    Cost Per 1000 Queries:      ~$0.10
    Cost Per Month (10K users): ~$50 (assuming 5 queries/user/month)
    
    Accuracy Target:            > 90% for high-confidence queries
    Escalation Rate Target:     < 10% of total queries
    User Satisfaction:          > 4.0/5.0 rating


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         FUTURE ENHANCEMENTS                                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝

    ✓ Completed: Basic RAG pipeline with in-memory storage
    ✓ Completed: Confidence scoring and escalation logic
    ✓ Completed: Multi-format document parsing (PDF, DOCX, TXT)
    
    ⏳ In Progress: Database integration (PostgreSQL + pgvector)
    
    🔮 Planned:
       - Hybrid RAG + Rule-based reasoning (Milestone 2.3)
       - Query intent classification (fee query vs academic query)
       - Multi-language support (English + Pidgin English)
       - Conversation history and follow-up questions
       - A/B testing different prompts and models
       - Real-time analytics dashboard for admin
       - Automated policy update detection
       - Student feedback loop for continuous improvement


═══════════════════════════════════════════════════════════════════════════════
                    End of RAG Architecture Documentation
                    Veritas University - MSc Computer Science
                    Student: Ediomo Titus (VPG/MSC/CSC/24/13314)
                    Date: February 2026
═══════════════════════════════════════════════════════════════════════════════
