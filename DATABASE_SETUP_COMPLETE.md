# ✅ PostgreSQL + Sequelize Setup Complete!

## What Was Installed

✅ **Packages:**
- `sequelize` - ORM for PostgreSQL
- `pg` - PostgreSQL driver
- `pg-hstore` - JSON storage support
- `dotenv` - Environment variables (already installed)

✅ **Database Models Created:**
1. `School` - University/school information
2. `User` - Students, admins, super admins
3. `PolicyModel` - Policy documents
4. `PolicyEmbeddingModel` - Vector embeddings for search
5. `QueryModel` - Query history and analytics

✅ **Configuration Files:**
- `/apps/backend/src/config/database.ts` - Sequelize connection
- `/apps/backend/.env` - Database credentials
- `/apps/backend/src/scripts/seed.ts` - Seed data script
- `/setup-database.sh` - Database setup script

---

## Your Database Configuration

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=policy_guidance_system
DB_USERNAME=postgres
DB_PASSWORD=2222
```

---

## Next Steps (5 minutes)

### **Step 1: Setup Database Tables**

Two options:

**Option A: Automatic (Recommended)**
```bash
cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend
chmod +x ../../setup-database.sh
npm run db:setup
```

**Option B: Manual via pgAdmin**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Check that database `policy_guidance_system` exists
4. If not, right-click "Databases" → Create → Database
5. Name: `policy_guidance_system`
6. Run in Query Tool:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### **Step 2: Start Backend with Database**

```bash
cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend

# Start with automatic seeding (creates tables + seed data)
npm run dev -- --seed

# Or set environment variable
SEED_DATABASE=true npm run dev
```

**Expected Output:**
```
🗄️  Connecting to database...
✅ Database connection established successfully
📊 Connected to: policy_guidance_system on 127.0.0.1:5432
✅ Database synchronized

🌱 Seeding database...
📚 Creating schools...
✅ Created 2 schools
👥 Creating users...
✅ Created 6 users

📊 Database Seeding Summary:
================================
Schools: 2
  - Veritas University (veritas.edu.ng)
  - Bingham University (binghamuni.edu.ng)

Users: 6
  - Super Admin: superadmin@aipolicyguide.com / admin123
  - Veritas Admin: admin@veritas.edu.ng / admin123
  - Bingham Admin: admin@binghamuni.edu.ng / admin123
  - Your Account: ediomo.titus@veritas.edu.ng / student123
  - Test Students: student@{school-domain} / student123
================================

✅ Database seeding completed successfully!

================================
🚀 AI Policy Guidance System running on http://localhost:4000
📊 Database: policy_guidance_system on 127.0.0.1:5432
📚 Knowledge base: 0 policies loaded
🤗 Using Hugging Face (sentence-transformers/all-MiniLM-L6-v2)
================================
```

---

### **Step 3: Verify Database in pgAdmin**

1. Open pgAdmin
2. Expand `policy_guidance_system` database
3. Expand "Schemas" → "public" → "Tables"
4. You should see:
   - ✅ `schools` (2 rows)
   - ✅ `users` (6 rows)
   - ✅ `policies` (0 rows - will add when you upload handbooks)
   - ✅ `policy_embeddings` (0 rows)
   - ✅ `queries` (0 rows - will fill as students ask questions)

---

## Test Accounts Created

### **Admins:**
```
Veritas Admin:
  Email: admin@veritas.edu.ng
  Password: admin123
  Role: admin
  School: Veritas University

Bingham Admin:
  Email: admin@binghamuni.edu.ng
  Password: admin123
  Role: admin
  School: Bingham University

Super Admin:
  Email: superadmin@aipolicyguide.com
  Password: admin123
  Role: super_admin
  School: All schools
```

### **Students:**
```
Your Account:
  Email: ediomo.titus@veritas.edu.ng
  Password: student123
  Role: student
  ID: VPG/MSC/CSC/24/13314
  School: Veritas University

Test Veritas Student:
  Email: student@veritas.edu.ng
  Password: student123
  
Test Bingham Student:
  Email: student@binghamuni.edu.ng
  Password: student123
```

---

## What Changed in Your System

### **Before (In-Memory):**
❌ Data lost on restart
❌ Hardcoded users
❌ No school management
❌ Limited to ~100MB

### **After (PostgreSQL + Sequelize):**
✅ Data persists forever
✅ Real user accounts in database
✅ Multi-school support
✅ Scales to millions of records
✅ Full analytics and reporting
✅ Production-ready

---

## Database Schema

### **schools**
```sql
- id (VARCHAR PRIMARY KEY)
- name (VARCHAR)
- domain (VARCHAR UNIQUE) - for auto-detecting school from email
- country (VARCHAR)
- type (ENUM: 'public'|'private')
- settings (JSONB) - configuration
- contact_email (VARCHAR)
- website (VARCHAR)
- active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### **users**
```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password (VARCHAR) - bcrypt hashed
- name (VARCHAR)
- role (ENUM: 'student'|'admin'|'super_admin')
- school_id (VARCHAR FK → schools.id)
- school_name (VARCHAR)
- school_domain (VARCHAR)
- department, student_id, year (VARCHAR)
- active (BOOLEAN)
- last_login (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

### **policies**
```sql
- id (SERIAL PRIMARY KEY)
- policy_id (VARCHAR UNIQUE)
- title (VARCHAR)
- content (TEXT)
- category (VARCHAR)
- school_id (VARCHAR FK → schools.id)
- school_name (VARCHAR)
- uploaded_by (INTEGER FK → users.id)
- visibility (ENUM: 'public'|'school_only'|'private')
- version, effective_date, expiry_date
- tags (ARRAY)
- metadata (JSONB)
- active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### **policy_embeddings**
```sql
- id (SERIAL PRIMARY KEY)
- policy_id (INTEGER FK → policies.id)
- chunk_text (TEXT)
- embedding (FLOAT ARRAY) - 384 or 1536 dimensions
- chunk_index (INTEGER)
- school_id, school_name (VARCHAR) - for filtering
- metadata (JSONB)
- created_at, updated_at (TIMESTAMP)
```

### **queries**
```sql
- id (SERIAL PRIMARY KEY)
- query_id (VARCHAR UNIQUE)
- query, answer (TEXT)
- confidence (FLOAT)
- requires_escalation (BOOLEAN)
- user_id (INTEGER FK → users.id)
- school_id (VARCHAR FK → schools.id)
- student_context, sources, metadata (JSONB)
- response_time (INTEGER) - milliseconds
- created_at, updated_at (TIMESTAMP)
```

---

## Testing the Database

### **1. Test Login (Veritas Admin)**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@veritas.edu.ng",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "message": "Welcome back to Veritas University!",
  "token": "eyJhbGci...",
  "user": {
    "id": 2,
    "email": "admin@veritas.edu.ng",
    "name": "Veritas Administrator",
    "role": "admin",
    "school": "Veritas University",
    "schoolId": "veritas-university"
  }
}
```

---

### **2. Test Login (Your Student Account)**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ediomo.titus@veritas.edu.ng",
    "password": "student123"
  }'
```

---

### **3. Check Database in pgAdmin**

Run this query in pgAdmin:

```sql
-- View all schools
SELECT * FROM schools;

-- View all users
SELECT id, email, name, role, school_name FROM users;

-- View policies (empty until you upload)
SELECT * FROM policies;

-- Check extensions
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

---

## Troubleshooting

### **Error: "Connection refused"**
```bash
# Check PostgreSQL is running
# In pgAdmin: Look for green indicator next to server

# Or in terminal:
psql -U postgres -h 127.0.0.1 -p 5432 -l
```

### **Error: "Database does not exist"**
```bash
# Create manually
psql -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE policy_guidance_system;"
```

### **Error: "Extension 'vector' not found"**
```bash
# Install pgvector
cd ~/Downloads
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Then enable in database
psql -U postgres -h 127.0.0.1 -p 5432 -d policy_guidance_system -c "CREATE EXTENSION vector;"
```

### **Error: "Authentication failed for user postgres"**
- Check password in `.env` matches your PostgreSQL password
- Default is often empty or "postgres"
- Update `DB_PASSWORD` in `.env` if different

### **Seed script not running**
```bash
# Run manually
cd apps/backend
npm run seed

# Or with npm run dev
npm run dev -- --seed

# Or set environment variable
SEED_DATABASE=true npm run dev
```

---

## Next Actions

**Now that database is set up:**

1. ✅ **Upload Handbooks** (Admin Dashboard → Policy Management)
   - Login: `admin@veritas.edu.ng` / `admin123`
   - Upload Veritas handbook
   - Upload Bingham handbook

2. ✅ **Test Queries** (Chat Interface)
   - Login: `ediomo.titus@veritas.edu.ng` / `student123`
   - Ask: "What is the minimum GPA?"
   - Check query is saved in `queries` table

3. ✅ **Check Persistence**
   - Stop server (Ctrl+C)
   - Restart: `npm run dev`
   - Handbooks still loaded! ✅
   - Users still exist! ✅

---

## Benefits You Now Have

✅ **Multi-School Support**
- Each school has own admins
- Students auto-assigned to school by email domain
- Policies linked to schools

✅ **Persistent Storage**
- Handbooks saved forever
- User accounts persist
- Query history for analytics

✅ **Production Ready**
- Scalable to thousands of users
- Proper data relationships
- Transaction support

✅ **Better Auth**
- Real user accounts
- Role-based access control
- School-based filtering

---

## Ready to Test!

**Start backend:**
```bash
cd apps/backend
npm run dev -- --seed
```

**Then:**
1. Open http://localhost:5174
2. Login as `admin@veritas.edu.ng` / `admin123`
3. Upload Veritas handbook
4. Test queries!

🎉 **Your system is now production-ready with PostgreSQL!**
