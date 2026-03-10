# 🚀 Quick Start Guide

## Welcome to the AI-Based Student Policy Guidance System!

This is an **MSc Computer Science research project** from Veritas University Abuja, implementing an AI system to help Nigerian university students understand institutional policies through conversational AI.

---

## 📖 New to This Project?

### Start Here (5 minutes):
1. **Read:** [README.md](./README.md) - Project overview and tech stack
2. **Check:** [PROJECT_STATUS.md](./PROJECT_STATUS.md) - ⭐ **Where we are now and what's next**

### Dive Deeper (20 minutes):
3. **Understand the Research:** [RESEARCH_OVERVIEW.md](./RESEARCH_OVERVIEW.md) - Academic context, objectives, methodology
4. **See the Plan:** [ROADMAP.md](./ROADMAP.md) - 40-week timeline with detailed milestones

### For Implementation Details (1 hour):
5. **Literature Context:** [docs/LITERATURE_REVIEW.md](./docs/LITERATURE_REVIEW.md) - Why this project matters
6. **Technical Methodology:** [docs/METHODOLOGY_IMPLEMENTATION.md](./docs/METHODOLOGY_IMPLEMENTATION.md) - How to build it

---

## 💻 Setup (First Time)

### Prerequisites
- **Node.js:** 18+ ([Download](https://nodejs.org/))
- **npm:** 9+ (comes with Node.js)
- **Git:** For version control
- **Code Editor:** VS Code recommended

### Installation

```bash
# 1. Navigate to project directory
cd /Users/edismacbook/Desktop/project-work-veritas

# 2. Install all dependencies (root + workspaces)
npm install

# 3. Verify installation
npm run build

# Expected output:
# ✓ Frontend build successful
# ✓ Backend build successful
```

### Verify Everything Works

```bash
# Run tests (should see 3 passing)
npm test

# Expected output:
# ✓ apps/backend/test/example.test.ts (1)
# ✓ apps/backend/test/integration/hello.test.ts (2)
# Test Files  2 passed (2)
# Tests  3 passed (3)
```

---

## 🏃‍♂️ Running the Application

### Development Mode (Hot Reload)

```bash
# Start both frontend and backend simultaneously
npm run dev

# This runs:
# - Backend: http://localhost:4000 (API server)
# - Frontend: http://localhost:5173 (React app)
```

**Access the app:** Open browser to `http://localhost:5173`

### Testing Individual Workspaces

```bash
# Backend only
npm run dev --workspace=apps/backend

# Frontend only
npm run dev --workspace=apps/frontend
```

### Testing the API

```bash
# Test the /api/hello endpoint
curl http://localhost:4000/api/hello

# Expected response:
# {"message":"Hello from backend service layer"}
```

---

## 📁 Project Structure (Key Files)

```
project-work-veritas/
├── 📄 README.md                    # Main overview
├── 📄 PROJECT_STATUS.md            # ⭐ Current status & next steps
├── 📄 ROADMAP.md                   # 40-week development plan
├── 📄 RESEARCH_OVERVIEW.md         # Complete research proposal
│
├── apps/
│   ├── backend/                    # Node.js/Express API
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point (port 4000)
│   │   │   ├── controllers/        # HTTP adapters
│   │   │   ├── services/           # Business logic
│   │   │   └── repositories/       # Data access
│   │   └── test/                   # Integration tests
│   │
│   └── frontend/                   # React/Vite app
│       ├── src/
│       │   ├── App.tsx             # Main component
│       │   └── main.tsx            # Entry point
│       └── index.html              # HTML template
│
├── packages/
│   └── shared-types/               # Type definitions
│       └── src/index.ts            # Zod schemas
│
└── docs/
    ├── LITERATURE_REVIEW.md        # Chapter 2 summary
    └── METHODOLOGY_IMPLEMENTATION.md # Chapter 3 guide
```

---

## 🎯 Current Status (Week 4)

### ✅ Completed
- Full monorepo setup with npm workspaces
- Backend Clean Architecture (Controllers → Services → Repositories)
- Frontend with Tailwind CSS
- Integration tests passing (3/3)
- Research documentation integrated (2,381 lines!)

### 🔴 Not Started (Next Phase)
- Vector database integration (Pinecone/FAISS)
- RAG pipeline (LangChain + OpenAI GPT-4)
- Rule-based inference engine
- Chat interface UI
- Admin dashboard

**👉 See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for complete details**

---

## 🧪 Common Commands

```bash
# Install dependencies
npm install

# Development (both apps)
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Clean node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules
```

---

## 🐛 Troubleshooting

### "Cannot find module '@ai-student-policy/shared-types'"
```bash
# Reinstall dependencies
npm install
```

### "Port 4000 already in use"
```bash
# Kill existing process
lsof -ti:4000 | xargs kill -9

# Or change port in apps/backend/src/index.ts
```

### "TypeScript errors in VS Code"
```bash
# Reload VS Code window
# Cmd+Shift+P → "Developer: Reload Window"
```

### Build fails
```bash
# Clean and rebuild
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
```

---

## 📚 Learning Resources

### For This Project
- **Architecture:** Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Research Context:** Read [RESEARCH_OVERVIEW.md](./RESEARCH_OVERVIEW.md)
- **Timeline:** Read [ROADMAP.md](./ROADMAP.md)

### Technologies Used
- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Express:** https://expressjs.com/
- **Vite:** https://vitejs.dev/
- **Zod:** https://zod.dev/

### Research Methodologies
- **Design Science Research (DSR):** [Hevner et al., 2004](https://doi.org/10.2307/25148625)
- **Technology Acceptance Model (TAM):** [Davis, 1989](https://doi.org/10.2307/249008)
- **TOE Framework:** [Tornatzky & Fleischer, 1990](https://mitpress.mit.edu/books/processes-technological-innovation)

---

## 🤝 Contributing (For Research Team)

### Before Making Changes
1. Read [PROJECT_STATUS.md](./PROJECT_STATUS.md) to understand current phase
2. Check [ROADMAP.md](./ROADMAP.md) to see if task is scheduled
3. Create a feature branch: `git checkout -b feature/your-feature`

### Code Quality Standards
```bash
# Before committing:
npm run lint        # Fix linting issues
npm run format      # Format with Prettier
npm test            # Ensure tests pass
npm run build       # Verify builds work
```

### Commit Message Format
```
type(scope): brief description

[optional body]

Related to: Milestone X.Y
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

**Example:**
```
feat(backend): add policy document parser

Implements PDF/DOCX parsing for knowledge base ingestion

Related to: Milestone 2.1 (Knowledge Base)
```

---

## 📊 Documentation Map

```
Quick Start (YOU ARE HERE)
    ↓
README.md (Tech overview)
    ↓
PROJECT_STATUS.md (Current phase & next steps) ⭐
    ↓
ROADMAP.md (40-week timeline)
    ↓
┌─────────────────────────────────────┐
│  For Research Context:              │
│  • RESEARCH_OVERVIEW.md             │
│  • docs/LITERATURE_REVIEW.md        │
│  • docs/METHODOLOGY_IMPLEMENTATION.md│
└─────────────────────────────────────┘
    ↓
ARCHITECTURE.md (Technical design)
```

---

## 🎓 Research Context

**Institution:** Veritas University Abuja  
**Program:** MSc Computer Science  
**Researcher:** Ediomo Titus (VPG/MSC/CSC/24/13314)  
**Supervisor:** [TBD]

**Research Question:**  
*"How can an AI-based conversational system effectively assist Nigerian university students in understanding institutional policies while maintaining accuracy and incorporating human oversight?"*

**Expected Outcomes:**
1. Functional AI guidance system (85%+ accuracy)
2. Evaluation with 150-200 students at 2 universities
3. Published conference/journal papers
4. MSc thesis defense

**Timeline:** 48 weeks (12 months) from start

---

## 🚦 Next Steps (Week 5-10)

### Priority 1: Ethical Clearance
- [ ] Submit IRB application to Veritas University
- [ ] Prepare participant consent forms
- [ ] Wait for approval (2-4 weeks)

### Priority 2: Partner Universities
- [ ] Contact University of Abuja
- [ ] Contact Baze University / Nile University
- [ ] Secure policy document access agreements

### Priority 3: Data Collection Prep
- [ ] Finalize interview protocols
- [ ] Collect 50-100 sample policy documents
- [ ] Set up document analysis template

### Priority 4: Technical Setup
- [ ] Sign up for Pinecone/OpenAI accounts
- [ ] Test vector database locally with FAISS
- [ ] Build prototype policy parser

**👉 Track progress in [PROJECT_STATUS.md](./PROJECT_STATUS.md)**

---

## ❓ Need Help?

### Documentation Questions
- Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current blockers
- Read [ROADMAP.md](./ROADMAP.md) for timeline details

### Technical Issues
- See **Troubleshooting** section above
- Check GitHub Issues (if repository is public)
- Contact research team

### Research Questions
- Review [RESEARCH_OVERVIEW.md](./RESEARCH_OVERVIEW.md)
- Consult thesis supervisor
- Refer to [docs/METHODOLOGY_IMPLEMENTATION.md](./docs/METHODOLOGY_IMPLEMENTATION.md)

---

## 📝 Quick Reference

| What You Need | Where to Look |
|---------------|---------------|
| Setup instructions | This file (QUICK_START.md) |
| Tech stack details | README.md |
| Current progress | PROJECT_STATUS.md ⭐ |
| Timeline & milestones | ROADMAP.md |
| Research background | RESEARCH_OVERVIEW.md |
| Literature review | docs/LITERATURE_REVIEW.md |
| Implementation guide | docs/METHODOLOGY_IMPLEMENTATION.md |
| Architecture details | ARCHITECTURE.md |

---

## ✅ Ready to Code?

```bash
# 1. Make sure everything is installed
npm install

# 2. Start development servers
npm run dev

# 3. Open browser to http://localhost:5173

# 4. Start building! Check PROJECT_STATUS.md for next tasks
```

---

**Happy Coding! 🎉**

*Last Updated: December 2024*  
*Document Version: 1.0*
