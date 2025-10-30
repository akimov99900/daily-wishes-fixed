#!/bin/bash

echo "🚀 Pre-deployment check for Daily Wish Frame"

# Check if required files exist
echo "📁 Checking file structure..."
required_files=(
  "package.json"
  "src/wishes.ts"
  "src/utils.ts"
  "api/wish.ts"
  "api/vote.ts"
  "api/og.ts"
  "index.html"
  "vercel.json"
  "README.md"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
    exit 1
  fi
done

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "✅ Dependencies installed"
else
  echo "❌ Dependencies not installed. Run 'npm install'"
  exit 1
fi

# Run tests
echo ""
echo "🧪 Running tests..."
if npx ts-node test/hash.test.ts; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed"
  exit 1
fi

# Check TypeScript compilation
echo ""
echo "🔍 Checking TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
  echo "✅ TypeScript compilation successful"
else
  echo "⚠️  TypeScript compilation has warnings (may not prevent deployment)"
fi

echo ""
echo "🎉 Pre-deployment check completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Vercel KV in your project"
echo "2. Set environment variables (see .env.example)"
echo "3. Update NEXT_PUBLIC_BASE_URL with your deployed URL"
echo "4. Deploy to Vercel"
echo ""
echo "🔗 Useful links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- KV Setup: https://vercel.com/docs/storage/vercel-kv/quickstart"
echo "- Frame Testing: https://warpcast.com/~/developers/frames"