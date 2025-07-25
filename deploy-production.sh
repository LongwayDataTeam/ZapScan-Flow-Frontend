#!/bin/bash

# Production Deployment Script for ZapScan Frontend
set -e

echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Load production environment variables
if [ -f "env.production" ]; then
    echo "📋 Loading production environment variables..."
    export $(cat env.production | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: env.production not found. Using default production settings."
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Build for production
echo "🏗️  Building for production..."
npm run build:prod

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed. Please check the build logs."
    exit 1
fi

echo "✅ Build completed successfully!"

# Optional: Docker build
if command -v docker &> /dev/null; then
    echo "🐳 Building Docker image..."
    docker build -t zapscan-frontend:latest .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker image built successfully!"
        echo "📋 To run the container:"
        echo "   docker run -p 80:80 zapscan-frontend:latest"
    else
        echo "❌ Docker build failed."
        exit 1
    fi
else
    echo "⚠️  Docker not found. Skipping Docker build."
fi

echo "🎉 Production deployment completed!"
echo "📁 Build files are in the 'build' directory"
echo "🌐 You can serve the build directory with any static file server" 