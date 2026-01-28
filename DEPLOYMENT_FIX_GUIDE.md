# 🔧 Complete Deployment Fix Guide

## Current Issues

1. ❌ **Frontend can't connect to backend** - Missing `/api` in URL
2. ❌ **Face verification not working** - Needs testing after API fix
3. ❌ **Database users table** - Needs verification

---

## 🎯 Step-by-Step Fix

### **Issue 1: Fix API Connection (CRITICAL)**

The frontend is calling:
```
https://ai-attendance-498h.onrender.com/auth/login ❌
```

But should be calling:
```
https://ai-attendance-498h.onrender.com/api/auth/login ✅
```

#### **Solution:**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/prince-mthethwas-projects/ai-attendance/settings/environment-variables

2. **Add Environment Variable:**
   - Click "Add Environment Variable"
   - **Name:** `VITE_API_URL`
   - **Value:** `https://ai-attendance-498h.onrender.com/api`
   - **Environment:** Select "Production"
   - Click "Save"

3. **Redeploy Frontend:**
   ```bash
   cd "C:\Users\mthet\OneDrive\Desktop\AI attendance"
   vercel --prod
   ```

4. **Wait 1-2 minutes** for deployment to complete

5. **Test:**
   - Open: https://ai-attendance-five.vercel.app
   - Try to login with:
     - Email: `admin@initiumventures.com`
     - Password: `Admin@123`

---

### **Issue 2: Face Verification Not Working**

#### **Possible Causes:**

1. **Backend not connected** (fixed by Issue 1)
2. **Camera permissions not granted**
3. **Face-API models not loading**
4. **Database facial descriptors missing**

#### **Testing Steps:**

After fixing Issue 1, test face verification:

1. **Open the app** and try to clock in with face
2. **Check browser console (F12)** for errors
3. **Look for these messages:**
   - ✅ `AI face recognition ready`
   - ✅ `Face detected with confidence`
   - ❌ If you see errors, report them

#### **Common Face Verification Fixes:**

**Problem: Camera not starting**
- Allow camera permissions in browser
- Check if another app is using the camera
- Try a different browser (Chrome recommended)

**Problem: "No face detected"**
- Ensure good lighting
- Face the camera directly
- Remove glasses/hat if possible
- Wait for green checkmark

**Problem: "Multiple faces detected"**
- Ensure only one person is in frame
- Check background for faces/photos

---

### **Issue 3: Database Users Table**

#### **Verify Database:**

1. **Open DBeaver**
2. **Connect to Aiven MySQL** (you already have this working)
3. **Run this query:**
   ```sql
   SELECT id, email, name, role, status, 
          CASE 
            WHEN facial_descriptors IS NULL THEN 'No face data'
            ELSE 'Has face data'
          END as face_status
   FROM users;
   ```

4. **Expected Result:**
   ```
   | id | email                        | name                  | role    | status | face_status    |
   |----|------------------------------|-----------------------|---------|--------|----------------|
   | 1  | admin@initiumventures.com    | System Administrator  | admin   | active | No face data   |
   | 5  | Lunga.student@university.com | Prince Mthethwa       | student | active | Has face data  |
   ```

#### **If Admin User Missing:**

Run this in DBeaver:
```sql
-- Check if admin exists
SELECT * FROM users WHERE email = 'admin@initiumventures.com';

-- If not found, create admin user
INSERT INTO users (email, password_hash, name, role, status)
VALUES (
  'admin@initiumventures.com',
  '$2a$10$GAIZzCrAet5.6xW.3PqP2ODgiyyJJB5m6qEvIykKXmninsWqHqJD.',
  'System Administrator',
  'admin',
  'active'
);
```

**Admin Login Credentials:**
- Email: `admin@initiumventures.com`
- Password: `Admin@123`

---

## 🧪 Complete Testing Checklist

After fixing the API URL, test these features:

### **1. Login (Password)**
- [ ] Admin can login with email/password
- [ ] Student can login with email/password
- [ ] Wrong password shows error

### **2. Login (Face Recognition)**
- [ ] Camera starts
- [ ] Face is detected (green checkmark)
- [ ] Login succeeds with face
- [ ] Wrong face shows error

### **3. Clock In/Out**
- [ ] Clock in with face works
- [ ] Clock in is fast (< 3 seconds)
- [ ] Clock out works
- [ ] Attendance record is saved

### **4. Dashboard**
- [ ] Admin dashboard loads
- [ ] Student dashboard loads
- [ ] Attendance history shows
- [ ] Charts display correctly

### **5. AI Chatbot**
- [ ] Chatbot opens
- [ ] Can send messages
- [ ] Gets responses (if Ollama running locally, or DeepSeek API configured)

---

## 🚨 If Problems Persist

### **Backend Logs (Render):**

1. Go to: https://dashboard.render.com
2. Click on your `ai-attendance` service
3. Click "Logs" tab
4. Look for errors

### **Frontend Logs (Browser):**

1. Open: https://ai-attendance-five.vercel.app
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Try the action that's failing
5. Copy any red error messages

### **Database Connection Test:**

Run this in DBeaver:
```sql
-- Test database connection
SELECT 'Database is working!' as status;

-- Check all tables exist
SHOW TABLES;

-- Expected tables:
-- ai_chat_history, attendance, leave_requests, notifications,
-- reports, settings, users, weekly_schedule
```

---

## 📞 Report Issues

If you still have problems after following this guide, provide:

1. **Which step failed?**
2. **Error message from browser console (F12)**
3. **Error message from Render logs**
4. **Screenshot of the issue**

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Login page loads without errors
2. ✅ Can login with admin credentials
3. ✅ Dashboard shows data
4. ✅ Face recognition works and is fast
5. ✅ Clock in/out completes in < 3 seconds
6. ✅ No 404 errors in browser console

---

## 🎉 Next Steps After Fix

Once everything works:

1. **Test on mobile** - Open the app on your phone
2. **Create more users** - Test with different roles
3. **Generate reports** - Test PDF/CSV exports
4. **Set up schedules** - Configure weekly schedules
5. **Test AI features** - Try the chatbot and predictions

---

## 📝 Important URLs

- **Frontend:** https://ai-attendance-five.vercel.app
- **Backend:** https://ai-attendance-498h.onrender.com
- **Backend Health:** https://ai-attendance-498h.onrender.com/health
- **Vercel Dashboard:** https://vercel.com/prince-mthethwas-projects/ai-attendance
- **Render Dashboard:** https://dashboard.render.com
- **Aiven Console:** https://console.aiven.io

---

**Last Updated:** 2026-01-29
**Status:** Awaiting Vercel environment variable fix
