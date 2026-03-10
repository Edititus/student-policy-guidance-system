# 🗄️ PostgreSQL + pgvector Setup Guide

## What We Need From You

### **1. Install PostgreSQL (5 minutes)**

Choose one option:

#### **Option A: Using Homebrew (Recommended for macOS)**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify it's running
psql --version
# Should show: psql (PostgreSQL) 15.x
```

#### **Option B: Using Postgres.app (GUI)**
1. Download from: https://postgresapp.com/
2. Install and open Postgres.app
3. Click "Initialize" to create default server
4. Server runs on port 5432

#### **Option C: Using Docker**
```bash
docker run --name veritas-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=veritas_policy_db \
  -p 5432:5432 \
  -d postgres:15
```

---

### **2. Install pgvector Extension (3 minutes)**

```bash
# Clone pgvector repo
cd ~/Downloads
git clone https://github.com/pgvector/pgvector.git
cd pgvector

# Build and install
make
sudo make install

# If you get permission errors, try:
# sudo make install PG_CONFIG=/opt/homebrew/opt/postgresql@15/bin/pg_config
```

---

### **3. Create Database (2 minutes)**

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE veritas_policy_db;

# Connect to it
\c veritas_policy_db

# Enable pgvector extension
CREATE EXTENSION vector;

# Verify it worked
SELECT * FROM pg_extension WHERE extname = 'vector';
# Should show: vector | 0.6.0 | ...

# Exit
\q
```

---

## What I'll Do Automatically

Once you run those 3 steps above, let me know and I'll:

✅ **Install Node.js packages:**
- `pg` - PostgreSQL client
- `pg-hstore` - For JSON storage
- `typeorm` or `sequelize` - ORM for database management

✅ **Create database schema:**
- `schools` table
- `users` table (with school linkage)
- `policies` table (with school linkage)
- `policy_embeddings` table (with vector column)
- `queries` table (for analytics)
- All indexes and relationships

✅ **Create migration scripts:**
- Initial schema creation
- Seed data (Veritas + Bingham schools)
- Test users (admins and students)

✅ **Update backend code:**
- Database connection configuration
- Replace in-memory storage with PostgreSQL
- Update RAGService to use pgvector
- Update auth controllers to use database
- Update admin controllers for persistence

✅ **Create database service layer:**
- `schoolService.ts` - School management
- `userService.ts` - User management
- `policyService.ts` - Policy CRUD operations
- `embeddingService.ts` - Vector search with pgvector

---

## Quick Start Commands for You

### **Step 1: Install PostgreSQL**
```bash
# Run this first
brew install postgresql@15
brew services start postgresql@15
```

### **Step 2: Install pgvector**
```bash
cd ~/Downloads
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### **Step 3: Create Database**
```bash
psql postgres -c "CREATE DATABASE veritas_policy_db;"
psql veritas_policy_db -c "CREATE EXTENSION vector;"
psql veritas_policy_db -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
```

### **Step 4: Tell Me "Done"**
Once you see `vector | 0.6.0` (or similar), reply with "done" or "ready" and I'll:
1. Install Node packages
2. Create all database tables
3. Migrate your RAGService to use PostgreSQL
4. Test everything works

---

## Expected Output

### **After PostgreSQL Installation:**
```bash
$ psql --version
psql (PostgreSQL) 15.5
```

### **After pgvector Installation:**
```bash
$ psql veritas_policy_db -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
 extname | extversion 
---------+------------
 vector  | 0.6.0
(1 row)
```

### **After Database Creation:**
```bash
$ psql veritas_policy_db -c "\dt"
                List of relations
 Schema |        Name        | Type  |  Owner   
--------+--------------------+-------+----------
 public | schools            | table | postgres
 public | users              | table | postgres
 public | policies           | table | postgres
 public | policy_embeddings  | table | postgres
 public | queries            | table | postgres
(5 rows)
```

---

## Troubleshooting

### **"brew: command not found"**
Install Homebrew first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### **"psql: command not found"**
After installing PostgreSQL, add to PATH:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### **"permission denied" during pgvector install**
Try with PG_CONFIG:
```bash
sudo make install PG_CONFIG=$(which pg_config)
```

### **"role 'postgres' does not exist"**
Create the user:
```bash
createuser -s postgres
```

### **"Connection refused" errors**
Check if PostgreSQL is running:
```bash
brew services list | grep postgresql
# Should show: postgresql@15  started
```

---

## Database Configuration

I'll create `.env` with these settings:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/veritas_policy_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=veritas_policy_db
DB_USER=postgres
DB_PASSWORD=postgres

# Or use your custom credentials if you set them up differently
```

---

## What This Enables

### **Before (In-Memory):**
❌ Data lost on restart
❌ Limited to ~100MB
❌ No multi-user support
❌ No analytics persistence

### **After (PostgreSQL + pgvector):**
✅ Data persists forever
✅ Scales to millions of records
✅ Multi-user with proper isolation
✅ Full analytics and reporting
✅ Vector similarity search built-in
✅ Ready for production deployment

---

## Time Estimate

| Task | Time | Your Action |
|------|------|-------------|
| Install PostgreSQL | 5 min | Run brew command |
| Install pgvector | 3 min | Clone and make |
| Create database | 2 min | Run psql commands |
| **TOTAL** | **10 min** | Copy-paste 3 commands |

Then I'll handle the rest (20-30 minutes of automated setup)!

---

## Ready?

**Run these 3 commands and tell me when done:**

```bash
# 1. Install PostgreSQL
brew install postgresql@15 && brew services start postgresql@15

# 2. Install pgvector
cd ~/Downloads && git clone https://github.com/pgvector/pgvector.git && cd pgvector && make && sudo make install

# 3. Create database
psql postgres -c "CREATE DATABASE veritas_policy_db;" && psql veritas_policy_db -c "CREATE EXTENSION vector;"
```

Then reply: **"Database ready"** and I'll set up everything else! 🚀
