# Hosting API Configuration Guide
## How to Fetch Frontend Data After Hosting

---

## Current Setup (Localhost)

### Frontend (.env)
```
VITE_API_URL=http://127.0.0.1:8000
```

### API Configuration (api.js)
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

---

## After Hosting - Step by Step

### Step 1: Update api.js to Use Environment Variable

**Current Code:**
```javascript
const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

**Updated Code:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';
```

This allows the API URL to be configured via environment variables.

---

### Step 2: Create Environment Files

#### **Local Development (.env.local)**
```env
VITE_API_URL=http://127.0.0.1:8000
```

#### **Production (.env.production)**
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

### Step 3: Update Hosting Platform Environment Variables

#### **For Vercel (Frontend Hosting):**
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend.onrender.com`
   - **Environment:** Production

#### **For Netlify (Frontend Hosting):**
1. Go to "Site settings" → "Environment variables"
2. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend.onrender.com`

#### **For Render (Frontend Hosting):**
1. Go to your web service
2. Click "Environment" tab
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend.onrender.com`

---

### Step 4: Update Backend CORS Settings

Your backend needs to allow requests from the hosted frontend.

**File:** `Pregnancy_Mental_Health/backend/app/main.py`

**Current:**
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

**Updated:**
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-frontend.vercel.app",  # Add your hosted frontend URL
    "https://your-frontend.netlify.app",
]
```

Or use environment variable:
```python
import os

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Add production frontend URL from environment
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
```

---

## Complete Hosting Workflow

### **Scenario: Deploy to Render (Backend) + Vercel (Frontend)**

#### 1. Deploy Backend to Render
```bash
# Backend URL will be:
https://ppd-backend.onrender.com
```

#### 2. Update Frontend Environment Variable
```env
# .env.production
VITE_API_URL=https://ppd-backend.onrender.com
```

#### 3. Update Backend CORS
```python
# main.py
origins = [
    "http://localhost:5173",
    "https://ppd-frontend.vercel.app",  # Your Vercel URL
]
```

#### 4. Deploy Frontend to Vercel
- Vercel will automatically use `.env.production`
- Frontend will now call: `https://ppd-backend.onrender.com/api/...`

---

## How Data Fetching Works After Hosting

### **Before (Localhost):**
```
Browser (localhost:5173)
    ↓
Frontend Code
    ↓
fetch("http://127.0.0.1:8000/api/assessments")
    ↓
Backend (localhost:8000)
    ↓
Response
```

### **After (Hosted):**
```
Browser (anywhere in the world)
    ↓
Frontend (https://ppd-frontend.vercel.app)
    ↓
fetch("https://ppd-backend.onrender.com/api/assessments")
    ↓
Backend (https://ppd-backend.onrender.com)
    ↓
Response
```

---

## Testing After Deployment

### 1. Check Environment Variable
Open browser console on your hosted site:
```javascript
console.log(import.meta.env.VITE_API_URL);
// Should show: https://ppd-backend.onrender.com
```

### 2. Test API Call
```javascript
fetch('https://ppd-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log);
```

### 3. Check Network Tab
- Open DevTools → Network
- Login or make any action
- Check API calls - should go to hosted backend URL

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Error:** "Access to fetch has been blocked by CORS policy"

**Solution:** Add frontend URL to backend CORS origins
```python
origins = [
    "https://your-frontend.vercel.app",
]
```

### Issue 2: 404 Not Found
**Error:** API calls return 404

**Solution:** Check API_BASE_URL includes `/api`:
```javascript
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
```

### Issue 3: Environment Variable Not Working
**Error:** Still calling localhost

**Solution:** 
1. Rebuild frontend after changing .env
2. Check environment variable is set in hosting platform
3. Verify variable name starts with `VITE_` (required for Vite)

### Issue 4: Mixed Content (HTTP/HTTPS)
**Error:** "Mixed Content: The page was loaded over HTTPS, but requested an insecure resource"

**Solution:** Ensure backend URL uses HTTPS:
```env
VITE_API_URL=https://your-backend.onrender.com  # ✅ HTTPS
VITE_API_URL=http://your-backend.onrender.com   # ❌ HTTP
```

---

## Environment Variable Priority

Vite loads environment variables in this order (highest priority first):

1. `.env.[mode].local` (e.g., `.env.production.local`)
2. `.env.[mode]` (e.g., `.env.production`)
3. `.env.local`
4. `.env`

**For production:** Use `.env.production`

---

## Quick Reference

### Local Development
```env
VITE_API_URL=http://127.0.0.1:8000
```

### Production (Render Backend)
```env
VITE_API_URL=https://your-app.onrender.com
```

### Production (Railway Backend)
```env
VITE_API_URL=https://your-app.railway.app
```

### Production (Heroku Backend)
```env
VITE_API_URL=https://your-app.herokuapp.com
```

---

## Deployment Checklist

- [ ] Update `api.js` to use `import.meta.env.VITE_API_URL`
- [ ] Create `.env.production` with hosted backend URL
- [ ] Update backend CORS to include frontend URL
- [ ] Set environment variable in hosting platform
- [ ] Deploy backend first
- [ ] Deploy frontend second
- [ ] Test API calls in browser console
- [ ] Check Network tab for correct URLs
- [ ] Test login/signup functionality
- [ ] Test all API endpoints

---

## Example: Complete Setup

### Backend (Render)
**URL:** `https://ppd-backend.onrender.com`

**main.py:**
```python
origins = [
    "http://localhost:5173",
    "https://ppd-frontend.vercel.app",
]
```

### Frontend (Vercel)
**URL:** `https://ppd-frontend.vercel.app`

**.env.production:**
```env
VITE_API_URL=https://ppd-backend.onrender.com
```

**api.js:**
```javascript
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
```

**Vercel Environment Variables:**
```
VITE_API_URL = https://ppd-backend.onrender.com
```

---

## Summary

**After hosting, data fetching works the same way, just with different URLs:**

1. ✅ Frontend calls hosted backend URL (via environment variable)
2. ✅ Backend allows requests from hosted frontend (via CORS)
3. ✅ All API calls work exactly the same as localhost
4. ✅ Users can access from anywhere in the world

**Key Point:** Use environment variables so you don't need to change code when switching between local and production!

---

**Last Updated:** [Current Date]  
**Status:** Ready for deployment
