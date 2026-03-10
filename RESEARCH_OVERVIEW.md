# AI-Based Student Policy Guidance System for Higher Institutions

## Research Project Information

**Institution:** Veritas University Abuja  
**School:** School of Postgraduate Studies  
**Department:** Computer and Information Technology  
**Faculty:** Natural and Applied Sciences  

**Research Title:** Development of an AI-Based Student Policy Guidance System for Higher Institutions  
**Researcher:** Ediomo Titus  
**Registration Number:** VPG/MSC/CSC/24/13314  
**Supervisor:** Dr. Mustapha Aminu Bagiwa  
**Degree:** Master of Science in Computer Science  
**Date:** January 2026

---

## Abstract

This research addresses the critical gap between policy development and accessibility in Nigerian higher education institutions (HEIs). Despite digital enhancements in transactional processes, existing systems cannot interpret, reason about, or clarify institutional rules when students inquire. This study develops and evaluates an AI-based student policy guidance framework that improves efficiency and decision-making transparency in Nigerian higher education institutions.

---

## Research Problem

Nigerian HEIs face a disconnect between complex, multilayered institutional policies and their practical accessibility. Key challenges include:

1. **Interpretive Inconsistency** - Similar cases resolved differently across departments
2. **Information Retrieval Barriers** - Difficulty locating specific policy clauses
3. **Administrative Inefficiency** - Manual processing of policy requests
4. **Lack of Explainability** - Decisions issued without clear policy rationale
5. **Static Policy Dissemination** - Updates not automatically integrated

---

## Research Aim and Objectives

### Aim
To develop and evaluate an AI-based student policy guidance framework that improves efficiency and decision-making transparency in Nigerian higher education institutions.

### Specific Objectives
1. Design a conceptual framework for representing institutional policy rules in a machine-interpretable form
2. Implement an AI-based policy guidance system using innovative IT artifacts for automated policy understanding
3. Deploy and evaluate the system's performance, accuracy, responsiveness, and institutional impact

---

## Research Questions

1. How can institutional policy rules be modeled within a machine-interpretable framework?
2. What are the functional and technical requirements for an AI system that interprets policies through natural language queries?
3. How well does the AI system interpret student policy questions in terms of accuracy and relevance?
4. What is the system's impact on administrative efficiency, policy consistency, and student satisfaction?
5. How does the system enhance students' access to institutional policies compared to current approaches?

---

## Significance of the Study

This research:
- **Advances NLP application** in non-Western, resource-constrained educational contexts
- **Proposes a scalable digital tool** to mitigate administrative bottlenecks
- **Reduces interpretative inconsistencies** and enhances procedural transparency
- **Empowers students** with timely, accurate, context-aware policy guidance
- **Supports digital transformation** goals of Nigerian higher education

---

## Scope

### Geographic and Institutional
- Nigerian higher education sector (federal, state, private institutions)
- Focus areas: course registration, deferment, withdrawal, examination misconduct, appeals

### Technological
- Rule-based reasoning + Natural Language Processing (NLP)
- System interprets structured policy rules and answers natural language queries
- Decision-support tool (not fully automated decision-making)

### Evaluation
- Technical accuracy, response relevance, user satisfaction
- Pilot testing in selected departments/faculties
- Focus on undergraduate students and administrative staff

---

## Theoretical Framework

### Models and Paradigms

1. **Technology-Organization-Environment (TOE) Framework**
   - Analyzes contextual factors affecting AI adoption
   - Considers technological, organizational, and environmental contexts

2. **Rule-Based System Architecture**
   - Knowledge Base: Formalized policy representations
   - Inference Engine: Logical reasoning for query responses
   - User Interface: Natural language chatbot interaction

3. **Design Science Research (DSR) Paradigm**
   - Problem identification and requirements gathering
   - Artifact design and development
   - Demonstration and evaluation in real-world context

4. **Human-in-the-Loop (HITL) Design**
   - AI as decision-support, not replacement
   - Confidence scoring and escalation pathways
   - Administrator dashboard for oversight

---

## System Architecture

### Components

1. **Data Preprocessing and Knowledge Base**
   - Policy document tokenization and categorization
   - Text embedding (text-embedding-ada-002, Sentence-BERT)
   - Metadata and context tags

2. **AI and Retrieval Module**
   - Retrieval-Augmented Generation (RAG) pipeline
   - Pre-trained language models (GPT, Transformers)
   - LangChain/Haystack integration

3. **Backend Architecture**
   - Node.js (Express) for API management
   - Vector database (Pinecone, Weaviate, FAISS)
   - PostgreSQL for session and interaction data

4. **Frontend and User Interface**
   - React.js web interface
   - Chat interface with AI responses and source citations
   - Responsive design (desktop and mobile)

---

## Research Methodology

### Design
Sequential mixed-methods approach within Design Science Research paradigm:

1. **Problem-Centered Design Phase** (Qualitative)
   - Interviews with students and administrators
   - Document analysis of policy frameworks
   - Requirements gathering

2. **Artifact Development Phase** (Technical)
   - System architecture design
   - Prototype development
   - Expert validation

3. **Evaluation Phase** (Mixed Methods)
   - Pilot deployment (4-6 weeks)
   - Performance logging and metrics
   - Surveys and focus groups

### Population and Sampling
- **Institutions:** Two universities in Abuja (one federal, one private)
- **Students:** 150-200 undergraduates (stratified random sample)
- **Staff:** 10-15 administrative personnel (purposive sample)
- **Documents:** All accessible student policy documents

### Data Collection Instruments
1. Semi-structured interview guides
2. Document analysis protocol
3. System design specification
4. Performance logging tool
5. Post-interaction surveys (5-point Likert scale)
6. Focus group discussion guides

---

## Key Definitions

- **AI (Artificial Intelligence)**: Machines mimicking human intelligence for learning, reasoning, problem-solving
- **Student Policy**: Official rules managing academic behavior and student well-being
- **Higher Education Institution (HEI)**: Post-secondary establishment offering advanced programs
- **Rule-Based System**: Expert system using IF-THEN logic for decision support
- **Natural Language Processing (NLP)**: AI technique enabling machines to understand human language
- **Chatbot**: Software program simulating human conversation
- **Policy Reasoning**: Automated interpretation of rules, conditions, and exceptions
- **Explainability**: System's ability to provide clear rationale for responses
- **Human-in-the-Loop (HITL)**: Design paradigm maintaining human oversight in AI systems

---

## Ethical Considerations

1. **Institutional Approval**: Ethical clearance from participating institutions
2. **Informed Consent**: Detailed information sheets and consent forms
3. **Confidentiality**: Anonymized data, secure storage, identifier removal
4. **Beneficence**: Decision-support tool with clear disclaimers
5. **Escalation Pathways**: Mandatory human oversight for critical issues
6. **Intellectual Property**: MoU governing prototype and data ownership

---

## Project Status

This codebase represents the technical implementation component of the research project. The system is currently in the **Artifact Development Phase**, with the following components implemented:

✅ Monorepo architecture with frontend and backend separation  
✅ Shared types package for type safety  
✅ Clean architecture (Controllers, Services, Repositories)  
✅ Tailwind CSS responsive frontend  
✅ Testing framework (Vitest + Supertest)  
✅ CI/CD pipeline (GitHub Actions)  
✅ Docker containerization  

**Next Steps:**
- [ ] Implement NLP and RAG pipeline
- [ ] Integrate vector database for policy embeddings
- [ ] Develop policy knowledge base from institutional documents
- [ ] Add conversational AI interface
- [ ] Deploy pilot system for evaluation

---

## License

This project is developed as part of academic research at Veritas University Abuja. All rights reserved.

## Contact

**Researcher:** Ediomo Titus  
**Email:** [Contact through Veritas University]  
**Institution:** Veritas University Abuja  
**Supervisor:** Dr. Mustapha Aminu Bagiwa
