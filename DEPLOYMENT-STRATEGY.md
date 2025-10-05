# Deployment Strategy

## Overview
This project supports both frontend-only and full-stack deployments to accommodate different development and production needs.

## Deployment Options

### 1. Frontend-Only (Development/Demo)
**Use when:** Frontend changes frequently, backend is stable or in development

**Files:**
- `index.html` - Uses mock data (`js/data.js`)
- `netlify-frontend.toml` - Shorter cache times for rapid iteration

**Benefits:**
- ✅ Fast frontend updates (30min cache)
- ✅ No backend dependencies
- ✅ Perfect for UI/UX development
- ✅ Works offline

### 2. Full-Stack (Production)
**Use when:** Backend is ready and stable

**Files:**
- `index-prod.html` - Uses Supabase backend
- `netlify.toml` - Standard production cache settings

**Benefits:**
- ✅ Real data persistence
- ✅ Multi-user support
- ✅ Production-ready

## How to Deploy

### Frontend-Only Deployment
```bash
# Rename config file
mv netlify.toml netlify-full.toml
mv netlify-frontend.toml netlify.toml

# Deploy to Netlify
git add .
git commit -m "Switch to frontend-only deployment"
git push origin main
```

### Full-Stack Deployment
```bash
# Switch to production HTML
mv index.html index-dev.html
mv index-prod.html index.html

# Use full config
mv netlify.toml netlify-frontend.toml
mv netlify-full.toml netlify.toml

# Deploy to Netlify
git add .
git commit -m "Switch to full-stack deployment"
git push origin main
```

## Environment Variables

### Frontend-Only
No environment variables needed.

### Full-Stack
Set in Netlify dashboard:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Cache Strategy

### Frontend-Only
- CSS/JS: 30 minutes (fast iteration)
- HTML: No cache (always fresh)

### Full-Stack
- CSS/JS: 1 hour (stable features)
- HTML: No cache (always fresh)

## Development Workflow

1. **Frontend Development**: Use frontend-only deployment
2. **Backend Development**: Use full-stack deployment
3. **Production**: Use full-stack deployment with proper environment variables

## Benefits of This Approach

- 🚀 **Faster frontend development** - No backend dependencies
- 🔄 **Independent deployments** - Frontend and backend can be updated separately
- 🧪 **Easy testing** - Switch between mock and real data
- 📱 **Better mobile development** - Test UI changes without backend complexity
- 🛡️ **Reduced risk** - Frontend changes don't affect backend stability
