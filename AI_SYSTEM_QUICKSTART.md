# 🤖 AI Policy Guidance System - Quick Start

## ✅ What We Just Built

You now have a **fully functional AI-powered policy guidance chatbot** with:

- ✅ **Document Parser** - Upload PDF/DOCX policy documents
- ✅ **Embedding Service** - Convert policies to vector embeddings (OpenAI)
- ✅ **RAG Pipeline** - Semantic search + GPT-4 answer generation
- ✅ **Chat API** - REST endpoints for querying
- ✅ **Beautiful Chat UI** - React chatbot interface with Tailwind CSS
- ✅ **Confidence Scoring** - HIGH/MEDIUM/LOW confidence indicators
- ✅ **Source Citations** - Shows which policies were used for answers

---

## 🚀 How to Run It

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create an account (if needed)
3. Generate a new API key
4. Copy the key

### Step 2: Configure Backend

```bash
cd apps/backend
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-proj-...
```

### Step 3: Start the Application

```bash
# From project root
npm run dev
```

This starts:
- Backend: http://localhost:4000 (API server)
- Frontend: http://localhost:5173 (Chat interface)

### Step 4: Open Your Browser

Navigate to **http://localhost:5173**

You should see the AI Policy Chatbot! 🎉

---

## 📤 How to Add Policies

### Option 1: Via API (Upload Documents)

```bash
curl -X POST http://localhost:4000/api/policies/upload \
  -F "file=@/path/to/student_handbook.pdf" \
  -F "institution=Veritas University"
```

### Option 2: Programmatically (For Testing)

Create a sample policy file (`apps/backend/src/seed-data.ts`):

```typescript
import { RAGService } from './services/ragService'
import { PolicyDocument, PolicyCategory, PolicyStatus } from './models/Policy'
import { v4 as uuidv4 } from 'uuid'

async function seedPolicies() {
  const ragService = new RAGService()

  const samplePolicies: PolicyDocument[] = [
    {
      id: uuidv4(),
      title: 'Course Registration Procedures',
      category: PolicyCategory.ACADEMIC,
      content: `
        All students must register for courses within the first two weeks of each semester.
        
        Registration Process:
        1. Log into the student portal
        2. Select courses based on your program curriculum
        3. Confirm your course selection
        4. Pay registration fees before the deadline
        
        Late Registration:
        Students who register after the deadline will be charged a late fee of ₦5,000.
        Registration is not allowed after the fourth week of the semester.
        
        Exceptions:
        Medical emergencies may be considered for late registration with proper documentation
        and approval from the Dean of Student Affairs.
      `,
      summary: 'Guidelines for course registration including deadlines and late registration fees',
      rules: [
        {
          id: 'reg-001',
          condition: 'Student registers within first 2 weeks',
          action: 'Normal registration (no late fee)',
          ambiguityLevel: 'LOW',
        },
        {
          id: 'reg-002',
          condition: 'Student registers between weeks 2-4',
          action: 'Late registration with ₦5,000 fee',
          ambiguityLevel: 'LOW',
        },
        {
          id: 'reg-003',
          condition: 'Student has medical emergency',
          action: 'May register late with Dean approval',
          exceptions: ['Requires medical documentation'],
          ambiguityLevel: 'MEDIUM',
        },
      ],
      metadata: {
        institution: 'Veritas University',
        academicYear: '2024/2025',
        version: '1.0',
        lastUpdated: new Date(),
        sourceDocument: 'student_handbook_2024.pdf',
        pageNumber: 15,
      },
      status: PolicyStatus.ACTIVE,
      tags: ['registration', 'courses', 'deadline', 'fees'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    },
    {
      id: uuidv4(),
      title: 'Academic Probation Policy',
      category: PolicyCategory.ACADEMIC,
      content: `
        Academic Probation is a status assigned to students who fail to meet minimum academic standards.
        
        Probation Criteria:
        A student will be placed on academic probation if their Cumulative Grade Point Average (CGPA)
        falls below 1.5 for two consecutive semesters.
        
        Consequences:
        - Student receives official probation notification
        - Must meet with academic advisor each semester
        - Cannot hold leadership positions in student organizations
        - Must improve CGPA to 1.5 or above within two semesters
        
        Withdrawal:
        If CGPA remains below 1.5 after two semesters on probation, the student may be withdrawn
        from the university. Students may appeal this decision to the Academic Board.
        
        Reinstatement:
        Withdrawn students may apply for reinstatement after one academic year.
      `,
      summary: 'Policy regarding academic probation for students with low CGPA',
      rules: [
        {
          id: 'prob-001',
          condition: 'CGPA < 1.5 for two consecutive semesters',
          action: 'Student placed on academic probation',
          ambiguityLevel: 'LOW',
        },
        {
          id: 'prob-002',
          condition: 'On probation for 2 semesters AND CGPA still < 1.5',
          action: 'Student may be withdrawn from university',
          exceptions: ['May appeal to Academic Board'],
          ambiguityLevel: 'MEDIUM',
        },
      ],
      metadata: {
        institution: 'Veritas University',
        academicYear: '2024/2025',
        version: '1.0',
        lastUpdated: new Date(),
        sourceDocument: 'academic_regulations.pdf',
        pageNumber: 23,
      },
      status: PolicyStatus.ACTIVE,
      tags: ['probation', 'cgpa', 'academic standing', 'withdrawal'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    },
    {
      id: uuidv4(),
      title: 'Tuition and Fee Payment Policy',
      category: PolicyCategory.FINANCIAL,
      content: `
        All students are required to pay tuition and fees before the start of each semester.
        
        Payment Deadlines:
        - Full payment: Due by first day of classes
        - First installment (50%): Due by first day of classes
        - Second installment (50%): Due by 6th week of semester
        
        Late Payment:
        Students who have not paid at least 50% of fees by the first day will not be allowed to attend classes.
        A late payment fee of ₦2,000 per week applies to unpaid balances.
        
        Financial Aid:
        Students with approved financial aid or scholarships must submit documentation to the Bursary
        before registration. Aid is applied after verification.
        
        Debt Clearance:
        Students with outstanding fees from previous semesters must clear all debts before registering
        for new courses. Transcripts and certificates will not be released to students with outstanding debts.
      `,
      summary: 'Payment deadlines, late fees, and financial aid policies',
      rules: [
        {
          id: 'pay-001',
          condition: 'Student pays less than 50% by first day',
          action: 'Cannot attend classes',
          consequences: '₦2,000 late fee per week',
          ambiguityLevel: 'LOW',
        },
        {
          id: 'pay-002',
          condition: 'Student has outstanding debt from previous semester',
          action: 'Cannot register for new courses',
          ambiguityLevel: 'LOW',
        },
      ],
      metadata: {
        institution: 'Veritas University',
        academicYear: '2024/2025',
        version: '1.0',
        lastUpdated: new Date(),
        sourceDocument: 'financial_policies.pdf',
        pageNumber: 8,
      },
      status: PolicyStatus.ACTIVE,
      tags: ['tuition', 'fees', 'payment', 'financial aid', 'debt'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
    },
  ]

  await ragService.loadPolicies(samplePolicies)
  console.log(`✅ Loaded ${samplePolicies.length} sample policies`)
  console.log(`📊 Stats:`, ragService.getStats())
}

seedPolicies()
```

Run it:
```bash
cd apps/backend
npx ts-node src/seed-data.ts
```

---

## 💬 Try These Sample Questions

Once the system is running, try asking:

1. **"How do I register for courses?"**
   - Should return registration procedures with deadlines

2. **"What happens if my CGPA drops below 1.5?"**
   - Should explain academic probation policy

3. **"When is the tuition payment deadline?"**
   - Should list payment deadlines and late fees

4. **"Can I register late if I have a medical emergency?"**
   - Should cite the exception clause with Dean approval

5. **"What are the late registration fees?"**
   - Should return ₦5,000 late fee information

---

## 🎨 Features

### 1. Semantic Search
- Converts your question to embeddings
- Finds most relevant policy sections
- Uses cosine similarity for ranking

### 2. RAG (Retrieval-Augmented Generation)
- Retrieves top 5 relevant policy chunks
- Passes context to GPT-4
- Generates natural, contextual answers

### 3. Confidence Scoring
- **HIGH**: ≥85% similarity, 3+ sources
- **MEDIUM**: ≥75% similarity, 2+ sources  
- **LOW**: <75% similarity or <2 sources

### 4. Source Citations
- Shows which policies were used
- Displays policy excerpts
- Includes page references

### 5. Escalation Logic
- Automatically escalates LOW confidence answers
- Suggests contacting admin for uncertain queries

---

## 📊 API Endpoints

### Chat Endpoints

**POST /api/chat/query**
```json
{
  "query": "How do I defer my studies?",
  "studentContext": {
    "program": "Computer Science",
    "year": 3,
    "level": "300"
  },
  "sessionId": "uuid"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "queryId": "uuid",
    "answer": "To defer your studies...",
    "confidence": "HIGH",
    "sources": [...],
    "reasoning": "Found 3 relevant policy sections...",
    "escalated": false,
    "timestamp": "2026-01-29T..."
  }
}
```

**GET /api/chat/stats**
```json
{
  "success": true,
  "data": {
    "policies": 3,
    "embeddings": 15
  }
}
```

### Policy Management (Admin)

**POST /api/policies/upload**
- Upload PDF/DOCX files
- Automatic parsing and embedding generation

**GET /api/policies**
- List all policies in knowledge base

---

## 🔧 Configuration

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-proj-...

# Optional
PORT=4000
```

### Customization

**Change LLM Model** (`apps/backend/src/services/ragService.ts`):
```typescript
private model = 'gpt-4o-mini'  // or 'gpt-4', 'gpt-3.5-turbo'
```

**Adjust Retrieval Settings**:
```typescript
const relevantChunks = await this.embeddingService.searchSimilar(
  query.query,
  this.policyEmbeddings,
  5,    // top-k results
  0.7   // similarity threshold (0-1)
)
```

---

## 💰 Cost Estimate

### OpenAI Pricing (as of Jan 2026)

**Embeddings (text-embedding-3-small):**
- $0.02 per 1M tokens
- ~500 policies = ~$0.10

**GPT-4o-mini:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- ~100 queries = ~$0.05

**Total for 500 policies + 1000 queries: ~$1-2**

---

## 🚧 Next Steps (Enhancements)

### 1. Vector Database
Replace in-memory storage with Pinecone/FAISS:
```bash
npm install @pinecone-database/pinecone
```

### 2. Database Integration
Add PostgreSQL for persistence:
```bash
npm install pg typeorm
```

### 3. Rule-Based Engine
Implement IF-THEN logic for deterministic answers

### 4. Admin Dashboard
Build UI for:
- Policy management
- Query analytics
- Response overrides

### 5. Authentication
Add student login and personalization

### 6. Multi-language Support
Add translations for Nigerian languages

---

## 🐛 Troubleshooting

### "OpenAI API key not provided"
- Create `.env` file in `apps/backend/`
- Add: `OPENAI_API_KEY=your_key`

### "No relevant policies found"
- Upload policy documents first
- Or run seed script to add sample policies

### "CORS Error"
- Backend should be running on port 4000
- Frontend proxy configured in `vite.config.ts`

### "Module not found"
```bash
# Reinstall dependencies
cd apps/backend
npm install --legacy-peer-deps
```

---

## 📚 Documentation

- **PROJECT_STATUS.md** - Overall project progress
- **ROADMAP.md** - 40-week development plan
- **RESEARCH_OVERVIEW.md** - Academic research context
- **PHASE_1_ACTION_PLAN.md** - Qualitative research guide

---

## 🎓 Academic Notes

This implementation covers:
- ✅ **Milestone 2.2**: RAG Pipeline (LangChain + OpenAI)
- ✅ **Milestone 2.4**: Chat Interface (React + Tailwind)
- 🟡 **Milestone 2.1**: Knowledge Base (basic, needs database)
- ❌ **Milestone 2.3**: Rule Engine (not implemented yet)
- ❌ **Milestone 2.5**: Admin Dashboard (TODO)

For your MSc thesis:
- Chapter 4.2: "System Implementation"
- Chapter 4.3: "RAG Pipeline Architecture"
- Chapter 5: "Evaluation Results" (after pilot)

---

## ✅ Success!

You now have a working AI policy guidance system! 🎉

**Try it out:**
1. Start the app: `npm run dev`
2. Open http://localhost:5173
3. Ask a policy question
4. See AI-generated answer with sources

**Next:** Add real policy documents from your university to make it more useful!

---

**Questions?** Check the documentation or contact the research team.

**Last Updated:** January 29, 2026
