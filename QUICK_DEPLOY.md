# ⚡ Quick Deploy Guide

Deploy in 15 minutes!

---

## 🚀 Step 1: Push to GitHub (2 min)

```bash
cd ~/OneDrive/Desktop/AI\ attendance

# Initialize git
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-attendance.git
git branch -M main
git push -u origin main
```

---

## 🎨 Step 2: Deploy Frontend to Vercel (3 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# When done, note your URL:
# https://ai-attendance-xxx.vercel.app
```

---

## 🚂 Step 3: Deploy Backend to Railway (5 min)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "+ New Project"
4. Select "Deploy from GitHub repo"
5. Choose `ai-attendance`
6. Click on service → Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

---

## 🗄️ Step 4: Add MySQL Database (2 min)

1. In Railway project, click "+ New"
2. Select "Database" → "MySQL"
3. Wait 30 seconds for provisioning
4. Note the URL for next step

---

## ⚙️ Step 5: Configure Environment Variables (3 min)

### Railway Backend:

Go to your service → "Variables" tab:

```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://ai-attendance-xxx.vercel.app
JWT_SECRET=make-this-very-long-and-random-abc123xyz789
JWT_EXPIRES_IN=7d
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_USER=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
DB_NAME=${{MYSQL_DATABASE}}
```

**Replace `ai-attendance-xxx.vercel.app` with YOUR Vercel URL!**

### Vercel Frontend:

Go to project → Settings → Environment Variables:

```env
VITE_API_URL=https://ai-attendance-backend-production.up.railway.app
```

**Replace with YOUR Railway backend URL!**

---

## 📊 Step 6: Import Database (3 min)

```bash
# Export local database
mysqldump -u root -p ai_attendance > backup.sql

# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Import
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backup.sql
```

---

## 🤖 Step 7: AI Configuration (Optional)

**For production AI**, get DeepSeek API key:

1. Go to https://platform.deepseek.com/
2. Sign up
3. Get API key
4. Add to Railway:

```env
DEEPSEEK_API_KEY=sk-your-key-here
```

**For development**, keep using Ollama locally!

---

## ✅ Step 8: Test!

1. Open your Vercel URL
2. Login
3. Try clock in/out
4. Test chatbot
5. Check mobile

---

## 🎊 Done!

Your app is live! Share the URL! 🚀

**Frontend**: https://your-app.vercel.app  
**Backend**: https://your-backend.up.railway.app  

---

## 🐛 Troubleshooting

**Can't connect to backend?**
- Check CORS_ORIGIN in Railway matches Vercel URL
- Check VITE_API_URL in Vercel matches Railway URL

**Database errors?**
- Make sure you imported the schema
- Check DB credentials in Railway variables

**AI not working?**
- Local dev: Use Ollama (already set up)
- Production: Add DEEPSEEK_API_KEY

---

## 💰 Cost

- Vercel: **FREE**
- Railway: **FREE** ($5 credit/month)
- Total: **$0/month** 🎉

---

**Full guide**: `DEPLOY_VERCEL_RAILWAY.md`  
**Checklist**: `DEPLOY_CHECKLIST.md`
