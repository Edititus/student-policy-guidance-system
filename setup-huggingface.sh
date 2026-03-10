#!/bin/bash

# 🤗 Hugging Face Setup Script for Veritas Policy System
# Run this after getting your HF API token

echo "🚀 Setting up Hugging Face for your Veritas Policy System..."
echo ""

# Step 1: Check if HF API key is set
if grep -q "your_hf_token_here" /Users/edismacbook/Desktop/project-work-veritas/apps/backend/.env; then
    echo "❌ ERROR: Hugging Face API key not configured!"
    echo ""
    echo "Please follow these steps:"
    echo "1. Go to: https://huggingface.co/settings/tokens"
    echo "2. Click 'New token' (select 'Read' type - it's FREE)"
    echo "3. Copy the token (starts with hf_...)"
    echo "4. Open apps/backend/.env"
    echo "5. Replace 'your_hf_token_here' with your actual token"
    echo ""
    exit 1
fi

echo "✅ API key configured"
echo ""

# Step 2: Check dependencies
cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend
if ! npm list @huggingface/inference > /dev/null 2>&1; then
    echo "📦 Installing Hugging Face SDK..."
    npm install @huggingface/inference
else
    echo "✅ Dependencies installed"
fi

echo ""
echo "🎯 Setup complete! Next steps:"
echo ""
echo "1. Start backend server:"
echo "   cd /Users/edismacbook/Desktop/project-work-veritas/apps/backend"
echo "   npm run dev"
echo ""
echo "2. Upload your handbooks:"
echo "   - Veritas University Handbook"
echo "   - Bingham University Handbook"
echo ""
echo "3. Test with sample queries:"
echo "   curl -X POST http://localhost:4000/api/chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\": \"What is the minimum GPA?\"}'"
echo ""
echo "📚 Read HUGGINGFACE_MIGRATION_GUIDE.md for detailed instructions"
echo ""
