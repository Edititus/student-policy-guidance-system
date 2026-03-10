#!/bin/bash

# Database Setup and Seed Script

echo "🗄️  PostgreSQL Setup for Veritas Policy System"
echo "=============================================="
echo ""

# Check if PostgreSQL is installed and running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL (psql) not found. Please install PostgreSQL first."
    echo "   brew install postgresql@15"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Database details from .env
DB_NAME="policy_guidance_system"
DB_USER="postgres"
DB_HOST="127.0.0.1"
DB_PORT="5432"

echo "📝 Database Configuration:"
echo "   Name: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Check if database exists
echo "🔍 Checking if database exists..."
if psql -U $DB_USER -h $DB_HOST -p $DB_PORT -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"
    echo "✅ Database created"
fi

echo ""

# Check if pgvector extension is installed
echo "🔍 Checking pgvector extension..."
PGVECTOR_CHECK=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_available_extensions WHERE name='vector';")

if [ "$PGVECTOR_CHECK" = "1" ]; then
    echo "✅ pgvector extension is available"
    
    # Enable pgvector
    echo "🔧 Enabling pgvector extension..."
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;"
    
    # Verify
    VERSION=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -tAc "SELECT extversion FROM pg_extension WHERE extname='vector';")
    if [ -n "$VERSION" ]; then
        echo "✅ pgvector $VERSION enabled successfully"
    else
        echo "⚠️  pgvector enabled but version check failed"
    fi
else
    echo "❌ pgvector extension not available"
    echo ""
    echo "📥 To install pgvector:"
    echo "   cd ~/Downloads"
    echo "   git clone https://github.com/pgvector/pgvector.git"
    echo "   cd pgvector"
    echo "   make"
    echo "   sudo make install"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🌱 Next steps:"
echo "   1. Start backend with seeding:"
echo "      cd apps/backend"
echo "      npm run dev -- --seed"
echo ""
echo "   2. Or manually seed database:"
echo "      npm run seed"
echo ""
