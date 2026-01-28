# CI/CD Pipeline Setup Guide

This guide explains how to set up the CI/CD pipeline for ProofEdge using GitHub Actions.

## Overview

The pipeline includes:
- **Build & Test**: Runs on every push and PR
- **Preview Deployments**: Automatic preview URLs for PRs
- **Production Deployment**: Auto-deploy to Vercel on merge to main
- **Supabase Migrations**: Auto-deploy database changes

## Required Secrets

You need to add these secrets to your GitHub repository:

### 1. Vercel Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions**

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | Go to [Vercel Account Settings](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel org/team ID | Run `vercel link` locally, check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Run `vercel link` locally, check `.vercel/project.json` |

### 2. Supabase Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase access token | Go to [Supabase Dashboard](https://app.supabase.com/account/tokens) → Generate token |
| `SUPABASE_PROJECT_REF` | Your project reference ID | Found in your Supabase project URL (e.g., `ghiobuubmnvlaukeyuwe`) |

## Step-by-Step Setup

### Step 1: Link Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run in project root)
vercel link

# This creates .vercel/project.json with your IDs
```

### Step 2: Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create"
3. Name it "GitHub Actions"
4. Copy the token

### Step 3: Get Supabase Token

1. Go to https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Name it "GitHub Actions"
4. Copy the token

### Step 4: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - `VERCEL_TOKEN`
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`

### Step 5: Push to GitHub

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

## How It Works

### On Pull Request
1. Runs build and tests
2. Creates a preview deployment on Vercel
3. Comments the preview URL on the PR

### On Merge to Main
1. Runs build and tests
2. Deploys to Vercel production
3. Runs Supabase migrations
4. Deploys Supabase Edge Functions

## Environment Variables

The workflow expects these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Set these in your Vercel project settings:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable for Production, Preview, and Development

## Workflow Files

```
.github/
└── workflows/
    └── ci-cd.yml      # Main CI/CD workflow
```

## Troubleshooting

### Build Fails
- Check if `npm run build` works locally
- Ensure all dependencies are in package.json

### Vercel Deployment Fails
- Verify VERCEL_TOKEN is correct
- Run `vercel link` locally to ensure project is linked

### Supabase Migrations Fail
- Verify SUPABASE_ACCESS_TOKEN is correct
- Check migration files for SQL errors
- Run `supabase db push` locally first

## Manual Deployment

If you need to deploy manually:

```bash
# Deploy to Vercel
vercel --prod

# Deploy Supabase migrations
npx supabase db push

# Deploy Supabase functions
npx supabase functions deploy
```

## Alternative: Netlify Deployment

If you prefer Netlify over Vercel, replace the deploy job with:

```yaml
deploy-netlify:
  name: Deploy to Netlify
  needs: build
  runs-on: ubuntu-latest
  
  steps:
    - uses: actions/checkout@v4
    - uses: actions/download-artifact@v4
      with:
        name: dist
        path: dist
    - uses: nwtgck/actions-netlify@v2
      with:
        publish-dir: './dist'
        production-deploy: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```
