# 🔍 Debug: Why VITE_API_URL Isn't Working

## The Problem

The frontend code has:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```

But the browser console shows it's calling:
```
ai-attendance-498h.onrender.com/auth/login
```

This means `VITE_API_URL` is set to `https://ai-attendance-498h.onrender.com` (without `/api`).

---

## 🎯 Solution: Set VITE_API_URL Correctly

### **Option 1: Set to Backend Root (Recommended)**

Since the code already adds `/api`, set the env var to just the backend URL:

1. Go to Vercel: https://vercel.com/prince-mthethwas-projects/ai-attendance/settings/environment-variables

2. **If `VITE_API_URL` already exists:**
   - Click "Edit" or "Delete" it
   - Change value to: `https://ai-attendance-498h.onrender.com` (NO `/api`)
   
3. **If it doesn't exist:**
   - Add new variable:
     - Name: `VITE_API_URL`
     - Value: `https://ai-attendance-498h.onrender.com`
     - Environment: Production

4. **Save** and redeploy

---

### **Option 2: Fix the Code (Alternative)**

Or we can change the code to NOT add `/api` automatically:

**Change `src/services/api.ts` line 1:**

FROM:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
```

TO:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

Then set `VITE_API_URL=https://ai-attendance-498h.onrender.com/api` in Vercel.

---

## 🤔 Which Option?

**I recommend Option 1** because:
- Less code changes
- The default already has `/api`
- Just need to update Vercel env var

---

## 📝 Current Situation

Based on the error, it seems you have:
- `VITE_API_URL=https://ai-attendance-498h.onrender.com` (without `/api`)

But the code expects:
- Either NO `VITE_API_URL` set (uses default with `/api`)
- OR `VITE_API_URL` set to backend root (code adds `/api`)

---

## ✅ Quick Fix Steps

1. **Check Vercel Environment Variables:**
   - Go to: https://vercel.com/prince-mthethwas-projects/ai-attendance/settings/environment-variables
   - Look for `VITE_API_URL`
   - What is the current value?

2. **If it says `https://ai-attendance-498h.onrender.com/api`:**
   - Change it to: `https://ai-attendance-498h.onrender.com` (remove `/api`)

3. **If it says `https://ai-attendance-498h.onrender.com`:**
   - Then the issue is the code is NOT adding `/api`
   - We need to change the code (see Option 2 above)

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## 🧪 Test After Fix

After redeploying, open browser console and check:
```javascript
// In browser console, type:
console.log('API_BASE_URL:', import.meta.env.VITE_API_URL);
```

It should show:
- Either: `https://ai-attendance-498h.onrender.com` (and code adds `/api`)
- Or: `https://ai-attendance-498h.onrender.com/api` (and code uses it as-is)

---

**Tell me: What is the CURRENT value of `VITE_API_URL` in your Vercel dashboard?**
