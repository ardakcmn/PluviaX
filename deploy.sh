#!/bin/bash

# PluviaX Deploy Script
# NASA Space Apps Challenge 2025

echo "🌦️ PluviaX Deploy Script Starting..."

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Uncommitted changes detected. Committing them..."
    git add .
    git commit -m "Auto-deploy: $(date)"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deploy completed!"
echo "🌐 Your app should be live at: https://pluviax.earth"
echo "🌍 Alternative URL: https://www.pluviax.earth"
