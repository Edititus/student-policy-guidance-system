# 🔑 Get Your FREE Hugging Face API Key

**Time needed:** 5 minutes  
**Cost:** $0 (completely free)

---

## Step-by-Step Instructions (With Screenshots)

### **Step 1: Create Account (2 minutes)**

1. Go to: **https://huggingface.co**

2. Click **"Sign Up"** (top right corner)

3. Enter:
   - Email: Your university email (e.g., `ediomo.titus@veritas.edu.ng`)
   - Username: Choose any username
   - Password: Create strong password

4. Verify your email (check inbox)

---

### **Step 2: Generate API Token (2 minutes)**

1. After login, click your profile picture (top right)

2. Select **"Settings"** from dropdown

3. In left sidebar, click **"Access Tokens"**
   - Or go directly to: https://huggingface.co/settings/tokens

4. Click **"New token"** button

5. Fill in:
   - **Name:** `Veritas Policy System`
   - **Type:** Select **"Read"** (this is FREE)
   - **Scope:** Leave default (all repos)

6. Click **"Generate token"**

7. **IMPORTANT:** Copy the token NOW
   - It looks like: `hf_abcdefghijklmnopqrstuvwxyz1234567890`
   - You won't be able to see it again!
   - Store it somewhere safe

---

### **Step 3: Add to Your Project (1 minute)**

```bash
# Open terminal
cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend

# Edit .env file
nano .env

# Find this line:
HUGGINGFACE_API_KEY=your_hf_token_here

# Replace with your actual token:
HUGGINGFACE_API_KEY=hf_abcdefghijklmnopqrstuvwxyz1234567890

# Save and exit:
# Press: Ctrl + X
# Press: Y (to confirm)
# Press: Enter
```

---

### **Step 4: Test It Works**

```bash
# Start backend
cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend
npm run dev

# You should see:
# ✓ Hugging Face RAG Service initialized
# ✓ Using model: sentence-transformers/all-MiniLM-L6-v2
# ✓ Server running on port 4000
```

**If you see errors:** Check that token is correctly pasted (no spaces)

---

## Token Details

### **What is it?**
An API key that lets your app use Hugging Face's AI models for free.

### **Free tier limits:**
- **Embeddings:** 100 requests per minute (enough for testing)
- **Text generation:** 50 requests per minute
- **Storage:** Unlimited
- **Cost:** $0 forever

### **Security tips:**
- ✅ Store in `.env` file (already gitignored)
- ✅ Never commit to GitHub
- ✅ Don't share publicly
- ❌ Don't hardcode in your code

---

## Troubleshooting

### **"Invalid token" error**
- Make sure you copied the FULL token (starts with `hf_`)
- Check for extra spaces before/after token
- Try generating a new token

### **"Rate limit exceeded"**
- You're making too many requests too fast
- Wait 60 seconds and try again
- Or add delays between requests (already implemented)

### **"Cannot find token in environment"**
- Check `.env` file exists: `ls apps/backend/.env`
- Restart backend after editing .env
- Check spelling: `HUGGINGFACE_API_KEY` (not `HUGGING_FACE_API_KEY`)

---

## Alternative: Using .env.local (If .env doesn't work)

Some systems prefer `.env.local`:

```bash
cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend
cp .env .env.local
nano .env.local
# Add your token, save, restart backend
```

---

## What Happens Next?

Once you have the token configured:

1. ✅ Backend will connect to Hugging Face
2. ✅ You can upload your handbooks
3. ✅ System will generate embeddings (FREE)
4. ✅ Students can ask questions (FREE)
5. ✅ Unlimited testing during development

---

## Token Types Explained

| Type | Access | Rate Limit | Cost | Use Case |
|------|--------|------------|------|----------|
| **Read** | Download models, use API | 100/min | FREE | Your project ✅ |
| **Write** | Upload models, edit repos | 100/min | FREE | Not needed |
| **Fine-tuning** | Train custom models | Custom | Paid | Future work |

**For your thesis, "Read" token is perfect!**

---

## Upgrading (Optional - Future)

If you need more during pilot testing:

**Hugging Face Pro:** $9/month
- 1,000 requests/minute (10x faster)
- Priority access (no waiting)
- Still way cheaper than OpenAI ($50+/month)

**But for now, free tier is enough!**

---

## Next Steps After Getting Token

1. ✅ Configure `.env` file
2. ✅ Start backend server
3. ✅ Upload Veritas Handbook
4. ✅ Upload Bingham Handbook
5. ✅ Test with sample questions
6. 📊 Evaluate accuracy
7. 🗄️ Set up PostgreSQL database
8. 🧪 Prepare pilot testing

---

## Need Help?

If you get stuck:
1. Check HUGGINGFACE_QUICKSTART.md for detailed instructions
2. Look at error messages in terminal
3. Let me know what error you're seeing

**You're almost done! Just this one API key and you can start testing your handbooks!** 🚀
