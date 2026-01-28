# 💯 100% FREE Deployment Guide

Deploy your AI Attendance System for **$0/month** - No credit card required!

---

## 🎯 Free Stack

- **Frontend**: Vercel (FREE forever)
- **Backend**: Render (FREE tier)
- **Database**: Render PostgreSQL (FREE tier)
- **AI**: Ollama (local dev) + DeepSeek API (free tier)

**Total Cost: $0/month** 🎉

---

## ⚠️ Free Tier Limitations

### Render Free Tier:
- ✅ **Backend**: Free web service
- ✅ **Database**: Free PostgreSQL (1GB)
- ⚠️ **Sleeps after 15 min** of inactivity (wakes in 30s)
- ⚠️ **Spins down** at 50s if no activity

### Vercel Free Tier:
- ✅ **100% free** forever
- ✅ No limitations for your use case
- ✅ Unlimited bandwidth
- ✅ Automatic SSL

### Trade-offs:
- **Cold starts**: First request after 15 min takes ~30 seconds
- **Database**: Must use PostgreSQL (not MySQL)
- **No credit card**: Completely free, no surprises!

---

## 📋 Part 1: Prepare Your Code

### Step 1: Update Database Config for PostgreSQL

**File: `server/config/db.js`**

Change from MySQL to PostgreSQL:

```javascript
// OLD (MySQL)
const mysql = require('mysql2/promise');
const pool = mysql.createPool({...});

// NEW (PostgreSQL)
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_attendance',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Update query functions
const query = async (sql, params) => {
  try {
    // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    const result = await pool.query(pgSql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const queryOne = async (sql, params) => {
  const results = await query(sql, params);
  return results[0];
};

module.exports = { query, queryOne, pool };
```

### Step 2: Update package.json (Backend)

**File: `server/package.json`**

Replace `mysql2` with `pg`:

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "express": "^4.18.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### Step 3: Convert MySQL Schema to PostgreSQL

**File: `server/schema.sql`** (create this)

```sql
-- PostgreSQL Schema for AI Attendance System

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  face_descriptor TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  status VARCHAR(50) DEFAULT 'present',
  hours_worked DECIMAL(5,2),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Chat History table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent VARCHAR(100),
  sentiment VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_clock_in ON attendance(clock_in);
CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_user_id ON schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
```

### Step 4: Push to GitHub

```bash
cd ~/OneDrive/Desktop/AI\ attendance

git init
git add .
git commit -m "Ready for free deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-attendance.git
git branch -M main
git push -u origin main
```

---

## 🎨 Part 2: Deploy Frontend to Vercel (FREE)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
cd ~/OneDrive/Desktop/AI\ attendance

vercel login
vercel

# Answer prompts:
# ? Set up and deploy? Yes
# ? Which scope? [Your account]
# ? Link to existing project? No
# ? What's your project's name? ai-attendance
# ? In which directory is your code located? ./
```

### Step 3: Note Your Vercel URL

```
✅ https://ai-attendance-xxx.vercel.app
```

**Save this!**

---

## 🆓 Part 3: Deploy Backend to Render (FREE)

### Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (FREE, no credit card!)
4. Authorize Render

### Step 2: Create PostgreSQL Database (FREE)

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Fill in:
   - **Name**: `ai-attendance-db`
   - **Database**: `ai_attendance`
   - **User**: `ai_attendance_user`
   - **Region**: Choose closest to you
   - **Plan**: **Free** ✅
4. Click "Create Database"
5. Wait ~2 minutes for provisioning

### Step 3: Get Database Connection Info

1. Click on your database
2. Copy these values:
   - **Internal Database URL** (for your backend)
   - Or individual values:
     - Hostname
     - Port
     - Database
     - Username
     - Password

### Step 4: Create Web Service (FREE)

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Fill in:
   - **Name**: `ai-attendance-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free** ✅

### Step 5: Set Environment Variables

In your web service settings, go to "Environment" tab.

Add these variables:

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://ai-attendance-xxx.vercel.app

JWT_SECRET=make-this-very-long-and-random-string-abc123xyz
JWT_EXPIRES_IN=7d

# Use the Internal Database URL from your PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# OR set individually:
DB_HOST=your-db-hostname
DB_PORT=5432
DB_USER=ai_attendance_user
DB_PASSWORD=your-db-password
DB_NAME=ai_attendance

# DeepSeek Cloud API (optional - has free tier)
# Get key at: https://platform.deepseek.com
# Free tier: ~100 requests/day
DEEPSEEK_API_KEY=sk-your-key-here-optional
```

**Important**: Replace `ai-attendance-xxx.vercel.app` with YOUR Vercel URL!

### Step 6: Update Database Config (if using DATABASE_URL)

**File: `server/config/db.js`**

```javascript
const { Pool } = require('pg');

// Support both DATABASE_URL and individual vars
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
```

### Step 7: Import Database Schema

**Option A: Using Render Dashboard**

1. Go to your PostgreSQL database
2. Click "Connect" → "External Connection"
3. Use provided command:

```bash
PGPASSWORD=your-password psql -h your-hostname -U your-username -d ai_attendance -f server/schema.sql
```

**Option B: Using Web Interface**

1. Go to https://dashboard.render.com
2. Click your database
3. Click "Connect"
4. Use provided web URL to access SQL editor
5. Copy/paste schema from `server/schema.sql`

### Step 8: Deploy!

Click "Create Web Service" - Render will:
1. Clone your repo
2. Install dependencies
3. Start your server
4. Give you a URL like: `https://ai-attendance-backend.onrender.com`

**Save this URL!**

---

## 🔗 Part 4: Connect Frontend & Backend

### Step 1: Update Vercel Environment Variables

1. Go to Vercel dashboard
2. Click your project
3. Go to "Settings" → "Environment Variables"
4. Add:

```env
VITE_API_URL=https://ai-attendance-backend.onrender.com
```

### Step 2: Redeploy Frontend

```bash
vercel --prod
```

---

## ⚡ Part 5: Handle Cold Starts (FREE Tier)

Render free tier sleeps after 15 min. Here's how to handle it:

### Frontend Loading State

**File: `src/utils/api.ts`** (or wherever you make API calls)

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Add timeout and retry for cold starts
export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds (for cold starts)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Show loading message for cold starts
api.interceptors.request.use((config) => {
  const lastRequest = localStorage.getItem('lastApiRequest');
  const now = Date.now();
  
  // If last request was > 15 min ago, show cold start message
  if (!lastRequest || now - parseInt(lastRequest) > 15 * 60 * 1000) {
    // Show toast/notification: "Waking up server, please wait 30s..."
    console.log('⏰ Server may be sleeping, warming up...');
  }
  
  localStorage.setItem('lastApiRequest', now.toString());
  return config;
});
```

---

## 🤖 Part 6: AI Configuration (FREE Options)

### Option A: DeepSeek Free Tier (RECOMMENDED)

1. Go to https://platform.deepseek.com
2. Sign up for free account
3. Get API key
4. Free tier: ~100 requests/day
5. Add to Render: `DEEPSEEK_API_KEY=sk-xxx`

### Option B: Local Ollama Only (Development)

- Keep using Ollama locally
- In production, chatbot shows basic responses
- Upgrade to paid API later if needed

---

## ✅ Part 7: Testing

1. Open your Vercel URL
2. First load might take 30s (cold start)
3. Test login
4. Test clock in/out
5. Test chatbot (if DeepSeek key added)

---

## 💰 Cost Breakdown (100% FREE)

| Service | Cost | Limitations |
|---------|------|-------------|
| **Vercel** | **$0** | None for your use case |
| **Render Backend** | **$0** | Sleeps after 15 min |
| **Render PostgreSQL** | **$0** | 1GB storage, 90 days |
| **DeepSeek API** | **$0** | ~100 requests/day free |
| **Total** | **$0/month** | Cold starts only issue |

---

## ⚠️ Important: Free Tier Notes

### Render Free Tier:
- **Sleeps** after 15 minutes of inactivity
- **Wakes** in ~30 seconds on first request
- **Data** deleted after 90 days of no activity (keep app active!)
- **Max** 750 hours/month (enough for most projects)

### Keep Your App Awake (Optional):

Use free service like **UptimeRobot**:
1. Go to https://uptimerobot.com
2. Sign up for free
3. Add monitor for your Render backend URL
4. Pings every 5 minutes
5. Prevents sleeping!

---

## 🎯 Alternative: Railway (Still Free!)

If you're okay with adding a credit card (NO CHARGES):

- Railway gives $5 credit/month
- More reliable (no cold starts)
- MySQL support (no migration needed)
- Only charges if you exceed $5 (unlikely)

**Your choice!** Both are effectively free.

---

## 📋 Deployment Checklist

- [ ] Updated to PostgreSQL
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Created Render PostgreSQL
- [ ] Created Render Web Service
- [ ] Set environment variables
- [ ] Imported database schema
- [ ] Connected frontend to backend
- [ ] Tested all features
- [ ] (Optional) Added UptimeRobot

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Wait 30s for cold start
- Check CORS_ORIGIN matches Vercel URL
- Check Render logs for errors

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check database is running in Render
- Make sure schema is imported

### "Timeout error"
- Increase timeout to 60s (cold start)
- First request after sleep takes time

### "AI not working"
- Check DEEPSEEK_API_KEY is set
- Or accept basic responses (free tier)

---

## 🎊 Success!

Your app is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Cost**: **$0/month** 🎉

---

## 🚀 Going Premium (Optional)

If you outgrow free tier:

**Render Paid** ($7/month):
- ✅ No cold starts
- ✅ Always online
- ✅ More resources

**Railway** ($5/month effective free):
- ✅ Better performance
- ✅ MySQL support
- ✅ No cold starts

But start with FREE and upgrade only if needed!

---

**🎉 You now have a 100% FREE production app!**

No credit card, no hidden costs, no surprises! 💯
