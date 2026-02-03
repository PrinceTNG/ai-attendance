<div align="center">

# 🤖 AI-Powered Smart Attendance System

[![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-success?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-attendance-five.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/PrinceTNG/ai-attendance)
[![Stars](https://img.shields.io/github/stars/PrinceTNG/ai-attendance?style=for-the-badge&logo=github)](https://github.com/PrinceTNG/ai-attendance/stargazers)

[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.0-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow-AI_Powered-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)

**A comprehensive AI-powered attendance management system with facial recognition, real-time tracking, intelligent analytics, and conversational AI assistance.**

### 🎯 Perfect for: Organizations • Educational Institutions • Remote Teams

[🚀 Try Live Demo](https://ai-attendance-five.vercel.app/) • [📖 Read Docs](#-table-of-contents) • [⭐ Star this repo](https://github.com/PrinceTNG/ai-attendance) • [📧 Contact](mailto:mthethwaprince10@gmail.com)

</div>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🎬 Demo & Screenshots](#-demo--screenshots)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔐 User Roles](#-user-roles)
- [🤖 AI Features Setup](#-ai-features-setup-optional)
- [📊 Database Schema](#-database-schema)
- [🧪 Available Scripts](#-available-scripts)
- [🐛 Troubleshooting](#-troubleshooting)
- [🌐 Deployment](#-deployment)
- [📝 Environment Variables](#-environment-variables)
- [🔒 Security Features](#-security-features)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

---

## 🎬 Demo & Screenshots

<div align="center">

### 🌐 [**View Live Application →**](https://ai-attendance-five.vercel.app/)

| Dashboard | Facial Recognition | Analytics |
|:---------:|:------------------:|:---------:|
| ![Dashboard](https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Admin+Dashboard) | ![Face Recognition](https://via.placeholder.com/300x200/43853D/FFFFFF?text=Face+Recognition) | ![Analytics](https://via.placeholder.com/300x200/FF6F00/FFFFFF?text=Analytics+%26+Reports) |

> 💡 **Tip:** Screenshots will be added soon. Visit the [live demo](https://ai-attendance-five.vercel.app/) to see the app in action!

</div>

---

## ✨ Key Features

### 🎯 Core Functionality
- **AI Facial Recognition** - TensorFlow.js powered face verification for secure clock-in/out
- **Real-time Attendance Tracking** - Live monitoring with location verification
- **Smart Clock-In/Out System** - Automated time tracking with overtime detection
- **Role-Based Access Control** - Admin, Employee, and Student dashboards

### 🤖 AI-Powered Features
- **Conversational AI Chatbot** - Natural language queries about attendance
- **Intelligent Predictions** - ML-based attendance pattern analysis
- **Smart Notifications** - Context-aware alerts and reminders
- **AI-Enhanced Face Detection** - Advanced facial recognition with liveness detection

### 📊 Management & Reporting
- **Leave Management** - Request, approve, and track various leave types
- **Schedule Management** - Manage work/class schedules and shifts
- **Advanced Reports** - Generate PDF/CSV reports with analytics
- **Dashboard Analytics** - Interactive charts and visualizations

### 🎨 User Experience
- **Modern UI** - Beautiful, responsive design with Tailwind CSS
- **Smooth Animations** - Framer Motion powered transitions
- **Mobile Optimized** - Works seamlessly on all devices
- **Dark Theme** - Eye-friendly interface

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **TensorFlow.js** & **face-api.js** - AI/ML capabilities
- **Chart.js** - Data visualization
- **React Router** - Navigation

### Backend
- **Node.js** + **Express** - Server framework
- **MySQL** - Database (XAMPP compatible)
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **PDFKit** - Report generation

### AI Services
- **Ollama** with **DeepSeek v3.1** - Local AI model
- **TensorFlow.js** - Face recognition
- **face-api.js** - Face detection

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- XAMPP (MySQL) running
- (Optional) Ollama for AI features

### Installation

1. **Clone the repository**
   ```bash
   cd "C:\Users\mthet\OneDrive\Desktop\AI attendance"
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install

   # Backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Setup Database**
   - Start XAMPP and enable MySQL
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Import `server/database/schema.sql`

4. **Configure Environment**
   ```bash
   # Frontend - Copy and configure
   copy .env.example .env
   # Edit .env: Set VITE_API_URL=http://localhost:5000/api

   # Backend - Copy and configure
   copy server\.env.example server\.env
   # Edit server/.env: Set database credentials
   ```

5. **Setup Admin Account**
   ```bash
   cd server
   npm run fix-admin
   cd ..
   ```
   Default admin credentials:
   - Email: `admin@initiumventures.com`
   - Password: `Admin@123`

6. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

---

## 📁 Project Structure

```
AI attendance/
├── src/                      # Frontend source
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── contexts/            # React contexts
│   ├── services/            # API & AI services
│   └── utils/               # Utilities
├── server/                  # Backend source
│   ├── config/             # Database config
│   ├── controllers/        # Route controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── services/           # AI services
│   ├── scripts/            # Utility scripts
│   └── database/           # SQL schemas
├── index.html              # Entry HTML
├── package.json            # Frontend dependencies
└── vite.config.ts          # Vite config
```

---

## 🔐 User Roles

### Admin
- Full system access
- User management
- Approve/reject leave requests
- Generate reports
- View all analytics

### Employee
- Clock in/out with facial recognition
- View personal attendance history
- Submit leave requests
- View schedules

### Student
- Similar to employee role
- Optimized for educational institutions

---

## 🤖 AI Features Setup (Optional)

### Setup Ollama for Conversational AI
1. Install Ollama: https://ollama.ai
2. Pull DeepSeek model:
   ```bash
   ollama serve
   ollama pull deepseek-v3.1:671b-cloud
   ```
3. Ensure `OLLAMA_API_URL=http://localhost:11434/api/chat` in `server/.env`

---

## 📊 Database Schema

### Core Tables
- **users** - User accounts with roles and facial descriptors
- **attendance** - Clock-in/out records with location data
- **leave_requests** - Leave management
- **reports** - Generated reports metadata
- **ai_chat_history** - AI chatbot conversations
- **notifications** - System notifications
- **schedules** - Work/class schedules
- **settings** - System configuration

---

## 🧪 Available Scripts

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run typecheck    # TypeScript check
```

### Backend
```bash
npm run start        # Start production server
npm run dev          # Start with auto-reload
npm run setup-admin  # Create admin user
npm run fix-admin    # Reset admin password
npm run export-db    # Export database
```

---

## 🐛 Troubleshooting

### Database Connection Issues
1. Ensure XAMPP MySQL is running
2. Check credentials in `server/.env`
3. Verify database exists: `ai_attendance`

### Facial Recognition Not Working
1. Allow camera permissions in browser
2. Ensure good lighting
3. Check console for errors

### Admin Login Issues
```bash
cd server
npm run fix-admin
```

### Port Already in Use
- Frontend (5173): Change in `vite.config.ts`
- Backend (5000): Change `PORT` in `server/.env`

---

## 🌐 Deployment

### Frontend (Vercel)
1. Build: `npm run build`
2. Deploy `dist` folder to Vercel
3. Set environment variable: `VITE_API_URL`

### Backend (Railway/Render)
1. Deploy server folder
2. Set environment variables
3. Use production MySQL (Aiven/PlanetScale)

---

## 📝 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_HUGGINGFACE_API_KEY=optional_key
```

### Backend (server/.env)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ai_attendance
OLLAMA_API_URL=http://localhost:11434/api/chat
```

---

## 🤝 Contributing

This is a portfolio project by Prince Mthethwa. For questions or feedback, please reach out.

---

## 📄 License

Private project - All rights reserved by Prince Mthethwa

---

## 🎓 About the Developer

**Prince Mthethwa**  
Full-stack developer specializing in AI-powered web applications.

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/today` - Today's attendance

### Users (Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reports
- `GET /api/reports/attendance-summary` - Generate attendance report
- `GET /api/reports/hours-report` - Generate hours report

### AI
- `POST /api/ai/chat` - AI chatbot conversation
- `POST /api/ai/analyze-attendance` - AI attendance analysis

---

## ⚙️ System Requirements

- **Node.js**: 18.0.0 or higher
- **MySQL**: 5.7 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Browser**: Modern browser with WebRTC support
- **Camera**: Required for facial recognition

---

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting ready
- Secure facial data storage

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/PrinceTNG/ai-attendance/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved © 2025 Prince Mthethwa.

For licensing inquiries, please contact: mthethwaprince10@gmail.com

---

## 📞 Contact

<div align="center">

### Prince Mthethwa
**Computer Systems Engineer | Full Stack Developer**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/prince-mthethwa-454b95316/)
[![Email](https://img.shields.io/badge/Email-Get_in_Touch-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mthethwaprince10@gmail.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-View_Projects-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://your-portfolio-url.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/PrinceTNG)

**📍 Johannesburg, South Africa | 📱 +27 79 531 3990**

---

### ⭐ Star this repository if you found it helpful!

[![GitHub stars](https://img.shields.io/github/stars/PrinceTNG/ai-attendance?style=social)](https://github.com/PrinceTNG/ai-attendance/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/PrinceTNG/ai-attendance?style=social)](https://github.com/PrinceTNG/ai-attendance/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/PrinceTNG/ai-attendance?style=social)](https://github.com/PrinceTNG/ai-attendance/watchers)

**Made with 💻 and ☕ by Prince Mthethwa**

</div>
