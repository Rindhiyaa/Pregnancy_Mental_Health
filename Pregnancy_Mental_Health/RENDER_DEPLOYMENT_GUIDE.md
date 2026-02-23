# Complete Render Deployment Guide

## 🎯 Overview

We'll deploy:
1. **Backend (FastAPI)** → Render Web Service
2. **Database (PostgreSQL)** → Render PostgreSQL
3. **Frontend (React)** → Render Static Site

**Total Cost:** $0/month (Free tier) or $7/month (Starter tier for better performance)

---

## 📋 PREREQUISITES

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub (recommended) or email
- Verify your email

### 2. Push Code to GitHub
```bash
# Initialize git (if not already done)
cd C:\Final_Year_Project\Pregnancy_Mental_Health
git init
git add .
git commit -m "Initial commit - PPD Predictor"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/ppd-predictor.git
git branch -M main
git push -u origin main
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### PHASE 1: Deploy PostgreSQL Database (10 minutes)

#### Step 1: Create PostgreSQL Database

1. Login to Render Dashboard
2. Click **New +** → **PostgreSQL**
3. Fill in details:
   - **Name:** `ppd-predictor-db`
   - **Database:** `ml_db`
   - **User:** `mluser`
   - **Region:** Choose closest to you
   - **Plan:** Free (or Starter $7/month)
4. Click **Create Database**

#### Step 2: Save Database Credentials

After creation, you'll see:
- **Internal Database URL:** `postgresql://mluser:password@hostname/ml_db`
- **External Database URL:** `postgresql://mluser:password@external-hostname/ml_db`

**Save these URLs!** You'll need them for backend.

---

### PHASE 2: Prepare Backend for Deployment (20 minutes)

#### Step 3: Create Environment Variables File

**Create `backend/.env.example`:**
```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production

# CORS
FRONTEND_URL=https://your-frontend.onrender.com
```

**Create `backend/.env` (for local development):**
```env
DATABASE_URL=postgresql://mluser:mlpass@localhost/ml_db
JWT_SECRET_KEY=dev-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
```

**Add to `.gitignore`:**
```
backend/.env
backend/venv/
backend/__pycache__/
backend/app/__pycache__/
```

#### Step 4: Update Database Configuration

**Update `backend/app/database.py`:**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

# Render uses postgresql:// but SQLAlchemy needs postgresql://
# Fix for Render's postgres URL format
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Step 5: Update CORS Configuration

**Update `backend/app/main.py`:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import predictions, auth, assessments
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PPD Predictor API", version="1.0.0")

# Get frontend URL from environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "https://*.onrender.com",  # Allow all Render subdomains
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
app.include_router(predictions.router)
app.include_router(auth.router)
app.include_router(assessments.router)

@app.get("/")
def root():
    return {"message": "PPD Predictor API is running!", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
```

#### Step 6: Update JWT Handler

**Update `backend/app/jwt_handler.py`:**
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration - Use environment variable
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-dev-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

# ... rest of the code stays the same
```

#### Step 7: Update Requirements.txt

**Ensure `backend/requirements.txt` has all dependencies:**
```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.36
psycopg2-binary==2.9.10
python-multipart==0.0.12
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
python-dotenv==1.0.1
catboost==1.2.7
pydantic[email]==2.10.3
joblib==1.5.3
gunicorn==21.2.0
```

#### Step 8: Create Build Script

**Create `backend/build.sh`:**
```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
```

Make it executable:
```bash
chmod +x backend/build.sh
```

---

### PHASE 3: Deploy Backend to Render (15 minutes)

#### Step 9: Create Backend Web Service

1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Fill in details:

**Basic Settings:**
- **Name:** `ppd-predictor-backend`
- **Region:** Same as database
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:** `./build.sh`
- **Start Command:** `gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

**Environment Variables:**
Click **Advanced** → **Add Environment Variable**

Add these:
```
DATABASE_URL = [Paste Internal Database URL from Step 2]
JWT_SECRET_KEY = [Generate random 32+ character string]
FRONTEND_URL = https://ppd-predictor-frontend.onrender.com
PYTHON_VERSION = 3.12.0
```

**To generate JWT secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

5. Click **Create Web Service**

#### Step 10: Wait for Backend Deployment

- Render will build and deploy (5-10 minutes)
- Watch the logs for any errors
- Once deployed, you'll get a URL like: `https://ppd-predictor-backend.onrender.com`

**Test backend:**
- Visit: `https://ppd-predictor-backend.onrender.com/`
- Should see: `{"message": "PPD Predictor API is running!", "status": "healthy"}`

---

### PHASE 4: Prepare Frontend for Deployment (15 minutes)

#### Step 11: Create Environment Configuration

**Create `frontend/.env.production`:**
```env
VITE_API_URL=https://ppd-predictor-backend.onrender.com/api
```

**Create `frontend/.env.development`:**
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

#### Step 12: Create API Configuration File

**Create `frontend/src/config.js`:**
```javascript
// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const API_BASE_URL = API_URL;

export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
};
```

#### Step 13: Update All API Calls

**Update all fetch calls to use config:**

Example in `SignInPage.jsx`:
```javascript
import { getApiUrl } from '../config';

// Instead of: fetch('http://127.0.0.1:8000/api/login')
const response = await fetch(getApiUrl('login'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

**Files to update:**
- `SignInPage.jsx`
- `SignUpPage.jsx`
- `ProfilePage.jsx`
- `DashboardPage.jsx`
- `HistoryPage.jsx`
- `NewAssessment.jsx`
- `ForgotPasswordPage.jsx`

#### Step 14: Create Build Configuration

**Create `frontend/render.yaml`:**
```yaml
services:
  - type: web
    name: ppd-predictor-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

#### Step 15: Update Vite Config for Production

**Update `frontend/vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})
```

---

### PHASE 5: Deploy Frontend to Render (10 minutes)

#### Step 16: Create Frontend Static Site

1. Go to Render Dashboard
2. Click **New +** → **Static Site**
3. Connect your GitHub repository
4. Fill in details:

**Basic Settings:**
- **Name:** `ppd-predictor-frontend`
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

**Environment Variables:**
```
VITE_API_URL = https://ppd-predictor-backend.onrender.com/api
NODE_VERSION = 20
```

5. Click **Create Static Site**

#### Step 17: Configure Redirects

After deployment, add redirect rules for React Router:

**Create `frontend/public/_redirects`:**
```
/*    /index.html   200
```

Redeploy to apply changes.

---

### PHASE 6: Update Backend CORS (5 minutes)

#### Step 18: Update Backend Environment Variables

Go to your backend service on Render:
1. Click **Environment**
2. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://ppd-predictor-frontend.onrender.com
   ```
3. Click **Save Changes**
4. Backend will automatically redeploy

---

### PHASE 7: Test Deployment (10 minutes)

#### Step 19: Test All Features

Visit your frontend URL: `https://ppd-predictor-frontend.onrender.com`

**Test checklist:**
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can create new assessment
- [ ] Assessment saves to history
- [ ] History page shows assessments
- [ ] Profile page loads
- [ ] Can update profile
- [ ] Logout works

---

## 🔧 TROUBLESHOOTING

### Issue 1: Backend won't start
**Check logs in Render dashboard**
- Missing dependencies? Update requirements.txt
- Database connection error? Check DATABASE_URL
- Port binding error? Ensure using `$PORT` variable

### Issue 2: Frontend can't connect to backend
**Check:**
- CORS settings in backend
- API_URL in frontend environment variables
- Backend is actually running (visit backend URL)

### Issue 3: Database connection fails
**Check:**
- DATABASE_URL is correct
- Database is running (check Render dashboard)
- Using Internal Database URL (not External)

### Issue 4: 404 errors on frontend routes
**Solution:**
- Add `_redirects` file to `frontend/public/`
- Content: `/*    /index.html   200`

---

## 💰 COSTS

### Free Tier (Good for testing)
- Backend: Free (spins down after 15 min inactivity)
- Database: Free (90 days, then $7/month)
- Frontend: Free
- **Total: $0/month (first 90 days)**

### Starter Tier (Recommended for production)
- Backend: $7/month (always on)
- Database: $7/month
- Frontend: Free
- **Total: $14/month**

---

## 🚀 DEPLOYMENT COMMANDS SUMMARY

```bash
# 1. Commit and push to GitHub
git add .
git commit -m "Prepare for Render deployment"
git push origin main

# 2. Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 3. Test locally before deploying
cd backend
python -m uvicorn app.main:app --reload

cd ../frontend
npm run build
npm run preview
```

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### Backend Environment Variables:
- [ ] `DATABASE_URL` - From Render PostgreSQL
- [ ] `JWT_SECRET_KEY` - Random 32+ character string
- [ ] `FRONTEND_URL` - Your frontend Render URL
- [ ] `PYTHON_VERSION` - 3.12.0

### Frontend Environment Variables:
- [ ] `VITE_API_URL` - Your backend Render URL + /api
- [ ] `NODE_VERSION` - 20

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Backend health check works: `/health`
- [ ] Database tables created automatically
- [ ] Frontend loads without errors
- [ ] Login/Signup works
- [ ] JWT tokens are generated
- [ ] Assessments save to database
- [ ] History loads from database
- [ ] CORS allows frontend requests
- [ ] All API endpoints work
- [ ] No console errors in browser

---

## 🔄 UPDATING YOUR APP

When you make changes:

```bash
# 1. Make changes locally
# 2. Test locally
# 3. Commit and push
git add .
git commit -m "Update: description of changes"
git push origin main

# Render will automatically redeploy!
```

---

## 📞 SUPPORT

**Render Documentation:**
- https://render.com/docs
- https://render.com/docs/deploy-fastapi
- https://render.com/docs/deploy-create-react-app

**Common Issues:**
- Build fails: Check logs in Render dashboard
- App crashes: Check runtime logs
- Database issues: Verify connection string

---

## 🎉 SUCCESS!

Once deployed, your app will be live at:
- **Frontend:** `https://ppd-predictor-frontend.onrender.com`
- **Backend:** `https://ppd-predictor-backend.onrender.com`
- **API Docs:** `https://ppd-predictor-backend.onrender.com/docs`

Share the frontend URL with users! 🚀
