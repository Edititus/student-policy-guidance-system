# 🗄️ PostgreSQL Setup Using Existing pgAdmin

## What I Need From You

### **1. Connection Details (From pgAdmin)**

Open pgAdmin and tell me:

**Server Details:**
- **Host:** (probably `localhost` or `127.0.0.1`)
- **Port:** (probably `5432`)
- **Username:** (probably `postgres` or your username)
- **Password:** (your PostgreSQL password)

**Where to find this in pgAdmin:**
1. Open pgAdmin
2. Right-click on your server (in left sidebar)
3. Click "Properties" → "Connection" tab
4. Tell me the values

---

### **2. Create Database (5 minutes)**

**Option A: Using pgAdmin GUI**

1. In pgAdmin, expand your server in left sidebar
2. Right-click on "Databases"
3. Click "Create" → "Database..."
4. Fill in:
   - **Database name:** `veritas_policy_db`
   - **Owner:** postgres (or your username)
5. Click "Save"

**Option B: Using SQL Query in pgAdmin**

1. Click on "PostgreSQL" server in pgAdmin
2. Click "Tools" → "Query Tool"
3. Paste this SQL:

```sql
-- Create database
CREATE DATABASE veritas_policy_db;
```

4. Click ▶️ (Execute/Run button) or press F5

---

### **3. Install pgvector Extension**

**Check if pgvector is already installed:**

1. In pgAdmin, expand your server
2. Connect to `veritas_policy_db` (double-click it)
3. Click "Tools" → "Query Tool"
4. Run this query:

```sql
-- Check if pgvector exists
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

**If it shows a row:** pgvector is available! Just enable it:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;
```

**If it shows nothing:** You need to install pgvector. Run this in terminal:

```bash
cd ~/Downloads
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

Then run the `CREATE EXTENSION` command above in pgAdmin.

---

### **4. Verify Everything Works**

In pgAdmin Query Tool, run:

```sql
-- 1. Check you're connected to correct database
SELECT current_database();
-- Should show: veritas_policy_db

-- 2. Check pgvector is installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
-- Should show: vector | 0.6.0 (or similar)

-- 3. Test vector type works
SELECT '[1,2,3]'::vector;
-- Should show: [1,2,3]
```

If all 3 queries work, you're ready! ✅

---

## What I Need You To Tell Me

Just reply with:

```
Host: localhost
Port: 5432
User: postgres
Password: [your password]
Database: veritas_policy_db
```

Or if you want to keep password private, just tell me:
- Host
- Port  
- Username
- Database name

And I'll add a placeholder password that you can update in `.env` file later.

---

## What I'll Do Next

Once I have your connection details, I'll:

1. ✅ Create `.env` file with database connection
2. ✅ Install Node.js packages (`pg`, `typeorm`)
3. ✅ Create database schema (tables, indexes)
4. ✅ Create migration scripts
5. ✅ Seed test data (schools, users, policies)
6. ✅ Update RAGService to use PostgreSQL + pgvector
7. ✅ Test everything works

---

## Quick Checklist

Before we proceed, verify:

- [ ] pgAdmin is installed and working
- [ ] PostgreSQL server is running (green indicator in pgAdmin)
- [ ] Database `veritas_policy_db` created
- [ ] pgvector extension enabled
- [ ] You have connection details (host, port, user, password)

Once checked, give me the connection details! 🚀

---

## Example Response

Just copy this and fill in your details:

```
✅ pgAdmin Setup Complete!

Connection Details:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: mypassword123
- Database: veritas_policy_db

pgvector status: Installed ✅
```

Then I'll handle the rest!
