# Namma Scheme - Government Scheme Assistant

A full-stack application to help citizens discover, understand, and apply for government schemes.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Setup

**Terminal 1 - Backend:**
```bash
cd namma-scheme-backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd namma-scheme-frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5177
- Backend API: http://localhost:8001/api
- Admin Login: http://localhost:5177/admin/login

## ✨ Features

✅ 3,398+ Government Schemes  
✅ Multi-Language Support (English, Hindi, Tamil)  
✅ AI-Powered Eligibility Checker  
✅ Admin Dashboard  
✅ Voice Search  
✅ SMS Notifications  
✅ User Authentication  

## 📁 Project Structure

```
namma-scheme/
├── namma-scheme-backend/     # Node.js + Express + MongoDB
│   ├── models/               # Database schemas
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   └── server.js             # Main server
│
├── namma-scheme-frontend/    # React + Vite
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context
│   │   └── App.jsx
│   └── package.json
│
└── docs/                     # Documentation
```

## 🔧 Configuration

### Backend (.env)
```
PORT=8001
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/namma_scheme
NODE_ENV=production
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8001/api
VITE_APP_ENV=production
```

## 📚 Tech Stack

**Backend:** Express.js, MongoDB, JWT, Gemini AI  
**Frontend:** React 19, Vite, React Router, Axios  

## 🚢 Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment instructions.

## 📖 Documentation

- [API Documentation](./docs/API.md)
- [Setup Guide](./docs/SETUP.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 📝 License

ISC
