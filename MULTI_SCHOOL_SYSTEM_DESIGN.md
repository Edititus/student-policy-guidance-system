# 🏫 Multi-School User System Design

## Current Problem

System hardcoded to `admin@veritas.edu.ng` - NOT flexible for multiple schools!

---

## Solution: Multi-Tenant Architecture

### **User Model (Updated):**

```typescript
// apps/backend/src/models/User.ts

export interface User {
  id: string
  email: string
  password: string // Hashed
  name: string
  role: 'student' | 'admin' | 'super_admin'
  
  // NEW: School information
  schoolId: string          // "veritas-university"
  schoolName: string        // "Veritas University"
  schoolDomain: string      // "veritas.edu.ng"
  
  // NEW: Additional metadata
  department?: string
  studentId?: string
  year?: string
  
  createdAt: Date
  lastLogin?: Date
}

export interface School {
  id: string                      // "veritas-university"
  name: string                    // "Veritas University"
  domain: string                  // "veritas.edu.ng"
  country: string                 // "Nigeria"
  type: 'public' | 'private'
  
  // Configuration
  settings: {
    allowStudentRegistration: boolean
    requireEmailVerification: boolean
    enableComparison: boolean     // Allow students to see other schools
  }
  
  // Contact
  contactEmail: string
  website: string
  
  createdAt: Date
  active: boolean
}
```

---

## Database Schema (PostgreSQL)

```sql
-- Table: schools
CREATE TABLE schools (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100),
  type VARCHAR(20),
  settings JSONB,
  contact_email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- Insert schools
INSERT INTO schools (id, name, domain, country, type, contact_email) VALUES
('veritas-university', 'Veritas University', 'veritas.edu.ng', 'Nigeria', 'private', 'info@veritas.edu.ng'),
('bingham-university', 'Bingham University', 'binghamuni.edu.ng', 'Nigeria', 'private', 'info@binghamuni.edu.ng'),
('unilag', 'University of Lagos', 'unilag.edu.ng', 'Nigeria', 'public', 'info@unilag.edu.ng');

-- Table: users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  
  -- School linkage
  school_id VARCHAR(100) REFERENCES schools(id),
  school_name VARCHAR(255),
  school_domain VARCHAR(255),
  
  -- Student info
  department VARCHAR(100),
  student_id VARCHAR(100),
  year VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_role ON users(role);

-- Super admin (manages all schools)
INSERT INTO users (email, password, name, role, school_id, school_name) VALUES
('superadmin@aipolicyguide.com', '$2b$10$...', 'Super Administrator', 'super_admin', NULL, NULL);

-- Veritas admin
INSERT INTO users (email, password, name, role, school_id, school_name, school_domain) VALUES
('admin@veritas.edu.ng', '$2b$10$...', 'Veritas Admin', 'admin', 'veritas-university', 'Veritas University', 'veritas.edu.ng');

-- Bingham admin
INSERT INTO users (email, password, name, role, school_id, school_name, school_domain) VALUES
('admin@binghamuni.edu.ng', '$2b$10$...', 'Bingham Admin', 'admin', 'bingham-university', 'Bingham University', 'binghamuni.edu.ng');

-- Students from multiple schools
INSERT INTO users (email, password, name, role, school_id, school_name, student_id, year) VALUES
('ediomo.titus@veritas.edu.ng', '$2b$10$...', 'Ediomo Titus', 'student', 'veritas-university', 'Veritas University', 'VPG/MSC/CSC/24/13314', 'MSc Year 1'),
('john.doe@binghamuni.edu.ng', '$2b$10$...', 'John Doe', 'student', 'bingham-university', 'Bingham University', 'BU/2024/001', 'Year 3'),
('jane.smith@unilag.edu.ng', '$2b$10$...', 'Jane Smith', 'student', 'unilag', 'University of Lagos', 'UL/2023/456', 'Year 2');
```

---

## Updated Authentication Flow

### **1. Registration (Auto-Detect School)**

```typescript
// apps/backend/src/controllers/authController.ts

export const register = async (req: Request, res: Response) => {
  const { email, password, name, studentId, year, department } = req.body
  
  // Extract domain from email
  const emailDomain = email.split('@')[1]  // "veritas.edu.ng"
  
  // Find school by domain
  const school = await School.findOne({ domain: emailDomain })
  
  if (!school) {
    return res.status(400).json({ 
      error: `No school found for domain: ${emailDomain}. Contact administrator.` 
    })
  }
  
  if (!school.active) {
    return res.status(403).json({ 
      error: `${school.name} is not currently active on this platform.` 
    })
  }
  
  // Check if registration allowed
  if (!school.settings.allowStudentRegistration) {
    return res.status(403).json({ 
      error: `${school.name} does not allow self-registration. Contact your administrator.` 
    })
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    role: 'student',
    schoolId: school.id,
    schoolName: school.name,
    schoolDomain: school.domain,
    studentId,
    year,
    department
  })
  
  // Generate token
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.schoolName
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
  
  res.json({
    message: `Welcome to ${school.name} Policy Guidance System!`,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      school: school.name
    }
  })
}
```

---

### **2. Login (Works for Any School)**

```typescript
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  
  // Find user (from ANY school)
  const user = await User.findOne({ email })
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  // Verify password
  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  // Check if school is active
  if (user.schoolId) {
    const school = await School.findById(user.schoolId)
    if (!school || !school.active) {
      return res.status(403).json({ 
        error: 'Your institution is not currently active on this platform' 
      })
    }
  }
  
  // Update last login
  await User.updateOne({ id: user.id }, { lastLogin: new Date() })
  
  // Generate token with school info
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.schoolName
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
  
  res.json({
    message: `Welcome back to ${user.schoolName || 'AI Policy Guide'}!`,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      school: user.schoolName,
      schoolId: user.schoolId
    }
  })
}
```

---

## Updated UI Components

### **1. Registration Form (School Auto-Detected)**

```typescript
// apps/frontend/src/components/Auth.tsx

const RegisterForm = () => {
  const [email, setEmail] = useState('')
  const [detectedSchool, setDetectedSchool] = useState<string | null>(null)
  
  useEffect(() => {
    // Auto-detect school from email domain
    if (email.includes('@')) {
      const domain = email.split('@')[1]
      
      const schoolMap: Record<string, string> = {
        'veritas.edu.ng': 'Veritas University',
        'binghamuni.edu.ng': 'Bingham University',
        'unilag.edu.ng': 'University of Lagos',
        'covenantuniversity.edu.ng': 'Covenant University'
      }
      
      setDetectedSchool(schoolMap[domain] || null)
    }
  }, [email])
  
  return (
    <form onSubmit={handleRegister}>
      <input
        type="email"
        placeholder="University Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      {detectedSchool && (
        <div className="bg-green-100 p-2 rounded">
          ✅ Registering for: <strong>{detectedSchool}</strong>
        </div>
      )}
      
      {email.includes('@') && !detectedSchool && (
        <div className="bg-yellow-100 p-2 rounded">
          ⚠️ Your school domain is not recognized. Contact support.
        </div>
      )}
      
      <input type="text" placeholder="Full Name" />
      <input type="text" placeholder="Student ID" />
      <input type="password" placeholder="Password" />
      
      <button type="submit">Register</button>
    </form>
  )
}
```

---

### **2. Admin Dashboard (School-Filtered)**

```typescript
// apps/backend/src/controllers/adminController.ts

export const getStats = async (req: Request, res: Response) => {
  const { schoolId, role } = req.user // From JWT token
  
  let filter = {}
  
  // Super admin sees all schools
  if (role === 'super_admin') {
    filter = {} // No filter
  }
  // Regular admin sees only their school
  else if (role === 'admin') {
    filter = { schoolId }
  }
  else {
    return res.status(403).json({ error: 'Access denied' })
  }
  
  // Get queries for this school only
  const queries = await Query.find(filter)
  
  // Get policies for this school only
  const policies = await Policy.find(filter)
  
  res.json({
    school: req.user.schoolName,
    totalQueries: queries.length,
    totalPolicies: policies.length,
    // ... other stats filtered by school
  })
}
```

---

## Policy Management (Multi-School)

### **Updated Policy Model:**

```typescript
export interface PolicyDocument {
  id: string
  title: string
  content: string
  category: PolicyCategory
  
  // NEW: School ownership
  schoolId: string          // "veritas-university"
  schoolName: string        // "Veritas University"
  uploadedBy: string        // User ID who uploaded
  
  // NEW: Visibility
  visibility: 'public' | 'school_only' | 'private'
  
  // Metadata
  version: string
  effectiveDate: Date
  expiryDate?: Date
  tags: string[]
  
  createdAt: Date
  updatedAt: Date
  active: boolean
}
```

### **Policy Upload (School-Linked):**

```typescript
export const uploadPolicy = async (req: Request, res: Response) => {
  const { schoolId, schoolName, userId } = req.user
  const { title, category, visibility = 'school_only' } = req.body
  const file = req.file
  
  // Extract text from PDF/DOCX
  const content = await extractText(file)
  
  // Create policy
  const policy = await Policy.create({
    id: uuidv4(),
    title,
    content,
    category,
    schoolId,           // ← Link to school
    schoolName,
    uploadedBy: userId,
    visibility,
    createdAt: new Date(),
    active: true
  })
  
  // Generate embeddings with school metadata
  const chunks = chunkText(content, 1000, 200)
  const embeddings = await generateEmbeddings(chunks)
  
  // Store embeddings with school info
  for (let i = 0; i < chunks.length; i++) {
    await PolicyEmbedding.create({
      policyId: policy.id,
      schoolId,         // ← For filtering
      schoolName,
      chunkText: chunks[i],
      embedding: embeddings[i],
      chunkIndex: i
    })
  }
  
  res.json({
    message: `Policy uploaded for ${schoolName}`,
    policy: {
      id: policy.id,
      title: policy.title,
      school: schoolName,
      chunks: chunks.length
    }
  })
}
```

---

## Query Handling (School-Aware)

### **Option 1: School-Only Search (Default)**

```typescript
export const answerQuery = async (query: PolicyQuery): Promise<PolicyResponse> => {
  const { schoolId, schoolName } = query.studentContext
  
  // Search only policies from student's school
  const schoolEmbeddings = this.policyEmbeddings.filter(
    emb => emb.metadata.schoolId === schoolId
  )
  
  const relevantChunks = await this.findSimilar(
    queryEmbedding,
    schoolEmbeddings, // ← Filtered by school
    5,
    0.5
  )
  
  // Generate answer using only their school's policies
  const answer = await this.generateAnswer(query.query, relevantChunks)
  
  return {
    answer,
    sources: relevantChunks.map(chunk => ({
      ...chunk,
      schoolName: chunk.metadata.schoolName
    }))
  }
}
```

---

### **Option 2: Multi-School Comparison (Optional)**

```typescript
export const answerQueryWithComparison = async (query: PolicyQuery) => {
  const { schoolId } = query.studentContext
  const { enableComparison } = query.options || {}
  
  if (enableComparison) {
    // Search ALL schools
    const allChunks = this.policyEmbeddings
  } else {
    // Search only student's school
    const allChunks = this.policyEmbeddings.filter(
      emb => emb.metadata.schoolId === schoolId
    )
  }
  
  const relevantChunks = await this.findSimilar(queryEmbedding, allChunks, 5, 0.5)
  
  // Group by school
  const bySchool = groupBy(relevantChunks, 'metadata.schoolName')
  
  // Generate answer mentioning multiple schools
  const answer = `
    **Your School (${query.studentContext.schoolName}):**
    ${generateAnswerForSchool(bySchool[query.studentContext.schoolName])}
    
    **Comparison with other universities:**
    ${Object.keys(bySchool).map(school => 
      `- ${school}: ${generateAnswerForSchool(bySchool[school])}`
    ).join('\n')}
  `
  
  return { answer, sources: relevantChunks }
}
```

---

## Super Admin Dashboard

```typescript
// View all schools
GET /api/super-admin/schools
→ [
  { id: "veritas-university", name: "Veritas University", active: true, userCount: 245, policyCount: 12 },
  { id: "bingham-university", name: "Bingham University", active: true, userCount: 189, policyCount: 8 },
  { id: "unilag", name: "University of Lagos", active: false, userCount: 0, policyCount: 0 }
]

// Add new school
POST /api/super-admin/schools
{
  "name": "Covenant University",
  "domain": "covenantuniversity.edu.ng",
  "country": "Nigeria",
  "type": "private",
  "contactEmail": "info@covenantuniversity.edu.ng"
}

// Create school admin
POST /api/super-admin/schools/:schoolId/admin
{
  "email": "admin@covenantuniversity.edu.ng",
  "name": "Covenant Administrator",
  "password": "securepassword"
}
```

---

## Summary

### **Current System:**
❌ Hardcoded to `admin@veritas.edu.ng`  
❌ Single-school only  
❌ No user registration  

### **Updated System:**
✅ Any school can join by email domain  
✅ Auto-detect school from email  
✅ School admins manage their own policies  
✅ Super admin manages all schools  
✅ Students see only their school (with option to compare)  
✅ Each school's data is isolated  

---

## Implementation Steps

**Phase 1: Database Setup (Week 1)**
1. Create `schools` table
2. Create `users` table with `school_id`
3. Update `policies` table with `school_id`
4. Seed with Veritas + Bingham data

**Phase 2: Auth Updates (Week 1)**
1. Update registration to auto-detect school
2. Update login to include school info in JWT
3. Add school-based filtering to all endpoints

**Phase 3: UI Updates (Week 2)**
1. Update registration form with school detection
2. Update admin dashboard to show school name
3. Add school filter to policy management

**Phase 4: Testing (Week 2)**
1. Register users from multiple schools
2. Upload policies for each school
3. Test cross-school queries
4. Verify data isolation

---

**Want me to:**
- ✅ Implement this multi-school system?
- ✅ Create migration scripts for existing data?
- ✅ Update the UI components?
- ✅ Set up super admin dashboard?
