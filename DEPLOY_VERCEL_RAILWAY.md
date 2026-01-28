# 🚀 Deploy to Vercel + Railway

Complete guide to deploy your AI Attendance System!

---

## 📋 What You'll Deploy

- **Frontend** → Vercel (React + Vite)
- **Backend** → Railway (Node.js + Express)
- **Database** → Railway (MySQL)
- **AI** → DeepSeek Cloud API (production) or keep Ollama (development)

---

## ⏱️ Time Required

- **Vercel Setup**: 5 minutes
- **Railway Setup**: 10 minutes
- **Configuration**: 5 minutes
- **Testing**: 5 minutes

**Total: ~25 minutes**

---

## 🎯 Part 1: Prepare Your Code

### Step 1: Create GitHub Repository

```bash
cd ~/OneDrive/Desktop/AI\ attendance

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AI Attendance System"

# Create repo on GitHub (go to github.com/new)
# Then link and push:
git remote add origin https://github.com/PrinceTNG/ai-attendance.git
git branch -M main
git push -u origin main
```

### Step 2: Update .gitignore

Make sure your `.gitignore` includes:
```
node_modules
.env
.env.local
.env.production
server/.env
server/node_modules
dist
.vercel
```

### Step 3: Update package.json (Frontend)

Add build script if not present:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🎨 Part 2: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to login with GitHub/Email.

### Step 3: Deploy

```bash
cd ~/OneDrive/Desktop/AI\ attendance

# Deploy
vercel

# Answer prompts:
# ? Set up and deploy? Yes
# ? Which scope? [Your account]
# ? Link to existing project? No
# ? What's your project's name? ai-attendance
# ? In which directory is your code located? ./
# ? Want to override the settings? No
```

### Step 4: Note Your Vercel URL

After deployment, you'll get a URL like:
```
https://ai-attendance-xxx.vercel.app
```

**Save this URL!** You'll need it for CORS configuration.

---

## 🚂 Part 3: Deploy Backend + Database to Railway

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub
4. Authorize Railway

### Step 2: Create New Project

1. Click "+ New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `ai-attendance` repository
4. Railway will detect Node.js

### Step 3: Configure Build Settings

1. Click on your service
2. Go to "Settings" tab
3. Set the following:

**Root Directory:**
```
server
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

### Step 4: Add MySQL Database

1. In your Railway project, click "+ New"
2. Select "Database"
3. Choose "MySQL"
4. Wait for it to provision (~30 seconds)

### Step 5: Get Database Credentials

1. Click on the MySQL service
2. Go to "Variables" tab
3. You'll see:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

**Copy these!** You'll need them.

### Step 6: Import Your Database Schema

Railway provides a MySQL URL. Use it to import your schema:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Connect to MySQL
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < path/to/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Create new connection with Railway credentials
3. Import your schema file
4. Import your data

### Step 7: Set Environment Variables

In Railway, go to your backend service → "Variables" tab.

Add these variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://ai-attendance-xxx.vercel.app

# JWT Configuration
JWT_SECRET=your-super-secret-production-jwt-key-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Database Configuration (use Railway's provided values)
DB_HOST=${{MYSQL_HOST}}
DB_PORT=${{MYSQL_PORT}}
DB_USER=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
DB_NAME=${{MYSQL_DATABASE}}

# DeepSeek Cloud API (for production)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# Or use Ollama URL if you have a separate Ollama server
# OLLAMA_API_URL=http://your-ollama-server:11434/api/chat
```

**Important:** 
- Replace `https://ai-attendance-xxx.vercel.app` with your actual Vercel URL
- Railway variables like `${{MYSQL_HOST}}` will auto-reference the MySQL service

### Step 8: Get Railway Backend URL

After deployment, Railway will give you a URL like:
```
https://ai-attendance-backend-production.up.railway.app
```

**Save this URL!**

---

## 🔗 Part 4: Connect Frontend to Backend

### Step 1: Update Frontend Environment Variables

In Vercel:
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add:

```
VITE_API_URL=https://ai-attendance-backend-production.up.railway.app
```

(Replace with your actual Railway backend URL)

### Step 2: Update Frontend API Configuration

Make sure your frontend uses the environment variable:

**File: `src/config/api.ts` or similar**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export default API_URL;
```

### Step 3: Redeploy Frontend

```bash
vercel --prod
```

---

## 🔒 Part 5: Configure CORS

Update your backend CORS configuration:

**File: `server/index.js`**
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

Make sure `CORS_ORIGIN` in Railway is set to your Vercel URL!

---

## 🤖 Part 6: Configure AI (Production)

### Option A: Use DeepSeek Cloud API (Recommended)

1. Go to https://platform.deepseek.com/
2. Sign up for an account
3. Get your API key
4. Add to Railway environment variables:

```env
DEEPSEEK_API_KEY=sk-your-api-key-here
```

Update `server/services/deepseekService.js` to support both Ollama and Cloud:

```javascript
const OLLAMA_API_URL = process.env.OLLAMA_API_URL;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const isDeepSeekAvailable = async () => {
  // Try Ollama first (for local dev)
  if (OLLAMA_API_URL) {
    try {
      const response = await fetch(OLLAMA_API_URL.replace('/api/chat', '/api/tags'), {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        console.log('✅ Using Ollama (local)');
        return true;
      }
    } catch (error) {
      // Ollama not available, try cloud
    }
  }
  
  // Use DeepSeek Cloud API
  if (DEEPSEEK_API_KEY) {
    console.log('✅ Using DeepSeek Cloud API');
    return true;
  }
  
  console.warn('⚠️ No AI service configured');
  return false;
};

const callDeepSeek = async (messages, options = {}) => {
  // Try Ollama first
  if (OLLAMA_API_URL) {
    try {
      // ... existing Ollama code ...
    } catch (error) {
      console.log('Ollama failed, trying cloud API...');
    }
  }
  
  // Use Cloud API
  if (DEEPSEEK_API_KEY) {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  throw new Error('No AI service available');
};
```

### Option B: Host Ollama Separately (Advanced)

If you want to use Ollama in production:
1. Rent a VPS (DigitalOcean, Linode, etc.)
2. Install Ollama + DeepSeek
3. Expose port 11434
4. Set `OLLAMA_API_URL` in Railway to your VPS URL

---

## 📊 Part 7: Database Migration

Export your local database and import to Railway:

```bash
# Export local database
mysqldump -u root -p ai_attendance > ai_attendance_backup.sql

# Import to Railway (use Railway CLI or MySQL Workbench)
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < ai_attendance_backup.sql
```

---

## ✅ Part 8: Testing

### Test Checklist:

1. **Frontend Loads**
   - ✅ Open your Vercel URL
   - ✅ Page loads correctly
   - ✅ No console errors

2. **Backend Connection**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Check browser network tab for API calls

3. **Database**
   - ✅ User data displays
   - ✅ Attendance records show
   - ✅ Can clock in/out

4. **AI Features**
   - ✅ Chatbot responds
   - ✅ AI insights work
   - ✅ No errors in chatbot

5. **Mobile Responsive**
   - ✅ Test on phone
   - ✅ All features work

---

## 🎯 Part 9: Custom Domain (Optional)

### On Vercel:
1. Go to project settings
2. Click "Domains"
3. Add your domain (e.g., `attendance.yourdomain.com`)
4. Update DNS as instructed

### On Railway:
1. Go to service settings
2. Click "Settings" → "Networking"
3. Add custom domain
4. Update DNS

---

## 💰 Cost Breakdown

### Free Tier Limits:

**Vercel:**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited projects
- ✅ Automatic SSL
- ✅ **FREE FOREVER**

**Railway:**
- ✅ $5 free credit/month
- ✅ ~500 hours execution time
- ✅ MySQL included in credit
- ✅ **Effectively FREE** for small projects

**DeepSeek API:**
- ✅ ~$0.14 per 1M tokens
- ✅ Your usage: ~$0.50-2/month
- ✅ **Very cheap!**

**Total: $0-2/month** 🎉

---

## 🐛 Troubleshooting

### Frontend not connecting to backend?
- Check CORS_ORIGIN matches Vercel URL
- Check VITE_API_URL is set correctly
- Check Railway backend is running

### Database connection failed?
- Verify Railway MySQL is running
- Check DB credentials in environment variables
- Make sure you imported schema

### AI not working?
- Check DEEPSEEK_API_KEY is set
- Verify API key is valid
- Check backend logs in Railway

### 500 errors?
- Check Railway logs (click service → "Logs" tab)
- Look for error messages
- Check all environment variables are set

---

## 📝 Environment Variables Checklist

### Railway Backend:
```
✅ PORT=5000
✅ NODE_ENV=production
✅ CORS_ORIGIN=https://your-vercel-url.vercel.app
✅ JWT_SECRET=long-random-string
✅ JWT_EXPIRES_IN=7d
✅ DB_HOST=${{MYSQL_HOST}}
✅ DB_PORT=${{MYSQL_PORT}}
✅ DB_USER=${{MYSQL_USER}}
✅ DB_PASSWORD=${{MYSQL_PASSWORD}}
✅ DB_NAME=${{MYSQL_DATABASE}}
✅ DEEPSEEK_API_KEY=your-api-key
```

### Vercel Frontend:
```
✅ VITE_API_URL=https://your-railway-backend.up.railway.app
```

---

## 🎊 Success!

Your AI Attendance System is now live! 🚀

**Frontend**: https://your-app.vercel.app  
**Backend**: https://your-backend.up.railway.app  
**Database**: Railway MySQL  
**AI**: DeepSeek Cloud API  

---

## 🔄 Continuous Deployment

Every time you push to GitHub:
- ✅ Vercel auto-deploys frontend
- ✅ Railway auto-deploys backend
- ✅ No manual steps needed!

Just:
```bash
git add .
git commit -m "Update feature"
git push
```

And your app updates automatically! 🎉

---

## 📚 Additional Resources

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- DeepSeek API: https://platform.deepseek.com/docs

---

## 🆘 Need Help?

If you get stuck:
1. Check Railway logs for backend errors
2. Check Vercel deployment logs
3. Check browser console for frontend errors
4. Make sure all environment variables are set

---

**Created by: Prince Mthethwa**  
**Date: January 28, 2026**  
**Status: Ready to Deploy! 🚀**
