#!/bin/bash

# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Vercel (if vercel CLI is installed)
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "Vercel CLI not found. Please install it with: npm i -g vercel"
    echo "Then run: vercel --prod"
fi 