# 🔧 Vercel Environment Variable Fix

## Problem
The frontend is getting 404 errors because `VITE_API_URL` is missing `/api` at the end.

## Solution

### Step 1: Update Environment Variable in Vercel

1. Go to: https://vercel.com/prince-mthethwas-projects/ai-attendance/settings/environment-variables

2. Find `VITE_API_URL` and change it to:
   ```
   https://ai-attendance-498h.onrender.com/api
   ```
   **Important**: Notice the `/api` at the end!

3. Make sure it's set for **Production** environment

4. Click **Save**

### Step 2: Redeploy Frontend

After saving the environment variable, run:

```bash
cd "C:\Users\mthet\OneDrive\Desktop\AI attendance"
vercel --prod
```

### Step 3: Test

1. Open: https://ai-attendance-five.vercel.app
2. Try to login with:
   - Email: `admin@initiumventures.com`
   - Password: `Admin@123`

## Why This Happened

In `src/services/api.ts`, line 1:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```

The default already includes `/api`, so when we set `VITE_API_URL` in Vercel, we need to include `/api` too.

## Backend Routes

The backend routes are mounted at `/api/*`:
- `/api/auth/login`
- `/api/attendance/clock-in`
- `/api/users`
- etc.

So the full URL should be: `https://ai-attendance-498h.onrender.com/api`
