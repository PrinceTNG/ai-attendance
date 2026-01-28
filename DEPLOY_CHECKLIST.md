# ✅ Deployment Checklist

Quick reference for deploying to Vercel + Railway

---

## 📋 Pre-Deployment

- [ ] Code is working locally
- [ ] All tests pass
- [ ] Database schema is ready
- [ ] Environment variables documented
- [ ] .gitignore is correct
- [ ] GitHub repository created

---

## 🎨 Vercel (Frontend)

### Setup
- [ ] Vercel CLI installed: `npm i -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Deployed: `vercel`
- [ ] Got Vercel URL: `https://_____.vercel.app`

### Configuration
- [ ] Added environment variable: `VITE_API_URL`
- [ ] Updated API config in code
- [ ] Redeployed with `vercel --prod`
- [ ] Tested: Frontend loads ✅

---

## 🚂 Railway (Backend + Database)

### Account Setup
- [ ] Signed up at railway.app
- [ ] Connected GitHub account
- [ ] Created new project from repo

### Backend Service
- [ ] Set root directory: `server`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Service deployed successfully

### MySQL Database
- [ ] Added MySQL database
- [ ] Got credentials (host, port, user, password, database)
- [ ] Database is running

### Environment Variables
- [ ] `PORT=5000`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN=` (Vercel URL)
- [ ] `JWT_SECRET=` (long random string)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `DB_HOST=${{MYSQL_HOST}}`
- [ ] `DB_PORT=${{MYSQL_PORT}}`
- [ ] `DB_USER=${{MYSQL_USER}}`
- [ ] `DB_PASSWORD=${{MYSQL_PASSWORD}}`
- [ ] `DB_NAME=${{MYSQL_DATABASE}}`
- [ ] `DEEPSEEK_API_KEY=` (optional, for production AI)

### Database Migration
- [ ] Exported local database
- [ ] Imported to Railway MySQL
- [ ] Verified data is present

---

## 🔗 Connect Frontend & Backend

- [ ] Updated Vercel env: `VITE_API_URL` = Railway backend URL
- [ ] Updated Railway env: `CORS_ORIGIN` = Vercel frontend URL
- [ ] Both services redeployed
- [ ] CORS working (no errors)

---

## 🤖 AI Configuration

**Option A: DeepSeek Cloud API (Production)**
- [ ] Created DeepSeek account
- [ ] Got API key
- [ ] Added to Railway: `DEEPSEEK_API_KEY`
- [ ] Updated backend code for dual support
- [ ] Tested: AI chatbot works

**Option B: Keep Ollama (Development Only)**
- [ ] Local Ollama works
- [ ] Production uses cloud API
- [ ] Environment detection working

---

## ✅ Testing

### Basic Functionality
- [ ] Frontend loads
- [ ] Login works
- [ ] Dashboard displays
- [ ] User data shows
- [ ] Attendance records load

### Core Features
- [ ] Clock In works
- [ ] Clock Out works
- [ ] Face recognition works
- [ ] Leave requests work
- [ ] Schedule displays

### AI Features
- [ ] Chatbot responds
- [ ] AI messages are smart/contextual
- [ ] No AI errors in console
- [ ] Response time acceptable

### Mobile
- [ ] Responsive on phone
- [ ] All buttons accessible
- [ ] Forms work on mobile
- [ ] Face detection works

---

## 🌐 Final Steps

- [ ] Tested on multiple browsers
- [ ] Tested on mobile device
- [ ] No console errors
- [ ] All features working
- [ ] Performance acceptable

---

## 🎊 Optional Enhancements

- [ ] Custom domain added
- [ ] SSL certificate verified
- [ ] Analytics added (Google Analytics)
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring

---

## 📝 URLs to Save

```
Frontend: https://_____________________.vercel.app
Backend:  https://_____________________.up.railway.app
Database: Railway MySQL (internal)
GitHub:   https://github.com/_____/_____
```

---

## 🐛 If Something Breaks

1. **Check Railway Logs**
   - Click backend service → "Logs" tab
   - Look for errors

2. **Check Vercel Logs**
   - Project → "Deployments" → Click latest
   - Check build logs

3. **Check Browser Console**
   - F12 → Console tab
   - Look for API errors

4. **Verify Environment Variables**
   - Railway: Variables tab
   - Vercel: Settings → Environment Variables

5. **Check CORS**
   - Make sure URLs match exactly
   - Include https://
   - No trailing slashes

---

## 🔄 Continuous Deployment

Every push to GitHub automatically deploys:

```bash
git add .
git commit -m "Update feature"
git push
```

✅ Vercel rebuilds frontend  
✅ Railway rebuilds backend  
✅ Live in ~2 minutes  

---

## 💰 Monthly Cost

- Vercel: **$0** (free forever)
- Railway: **$0-5** ($5 free credit)
- DeepSeek API: **$0.50-2** (very cheap)

**Total: ~$0-2/month** 🎉

---

## ✅ DONE!

Your AI Attendance System is live! 🚀

Share your URL and enjoy! 🎊
