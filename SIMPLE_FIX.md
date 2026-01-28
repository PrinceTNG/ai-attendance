# 🔧 Simple Fix - Step by Step

## The Issue

The frontend is calling:
```
ai-attendance-498h.onrender.com/auth/login ❌ (missing https:// and /api)
```

Should be:
```
https://ai-attendance-498h.onrender.com/api/auth/login ✅
```

---

## 🎯 The Fix (Do This Now)

### **Step 1: Set Environment Variable in Vercel**

1. Go to: https://vercel.com/prince-mthethwas-projects/ai-attendance/settings/environment-variables

2. **Check if `VITE_API_URL` exists:**
   - If YES: Click the **three dots (...)** → **Edit**
   - If NO: Click **"Add Environment Variable"**

3. **Set these values:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://ai-attendance-498h.onrender.com/api`
   - **Environment:** Check ✅ **Production**
   - Click **Save**

4. **Screenshot what you see** and tell me if there are any other environment variables listed

---

### **Step 2: Trigger a New Deployment**

After saving the environment variable, you MUST redeploy:

```bash
cd "C:\Users\mthet\OneDrive\Desktop\AI attendance"
vercel --prod
```

**Important:** Environment variables are only loaded during BUILD time, not runtime!

---

### **Step 3: Wait & Test**

1. **Wait 2-3 minutes** for deployment to complete
2. **Clear browser cache** (Ctrl+Shift+Delete → Clear cached images and files)
3. **Open in incognito/private window:** https://ai-attendance-five.vercel.app
4. **Try to login**

---

## 🤔 Still Not Working?

If it still shows the same error, there might be an issue with how the code reads the env var.

**Let's fix the code instead:**

Run this command to update the API configuration:

```bash
cd "C:\Users\mthet\OneDrive\Desktop\AI attendance"
```

Then I'll update the code to handle the environment variable correctly.

---

## 📸 What I Need From You

Please tell me:

1. ✅ Did you add `VITE_API_URL` in Vercel? (Yes/No)
2. ✅ What value did you set? (Copy-paste the exact value)
3. ✅ Did you check "Production" environment? (Yes/No)
4. ✅ Did you run `vercel --prod` after adding it? (Yes/No)
5. ✅ Did you wait 2-3 minutes and clear browser cache? (Yes/No)

Once you confirm these steps, I'll know exactly what to fix next! 🎯
