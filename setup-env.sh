#!/bin/bash

# Money Pot Environment Setup Script
echo "🚀 Setting up Money Pot environment..."

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created! Please update it with your actual values."
else
    echo "✅ .env file already exists."
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    bun install
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed."
fi

# Create KV namespace for development
echo "🗄️ Setting up KV namespace..."
echo "Run these commands to create KV namespaces:"
echo "  wrangler kv:namespace create \"money-pot-kv\""
echo "  wrangler kv:namespace create \"money-pot-kv-preview\" --preview"
echo ""
echo "Then update wrangler.toml with the returned IDs."

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your actual values"
echo "2. Create KV namespaces (see commands above)"
echo "3. Run 'bun run dev' to start development server"
echo "4. Run 'node test-integration.js' to test the integration"
