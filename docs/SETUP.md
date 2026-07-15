# Setup Guide

## Prerequisites

- Node.js v16 or higher
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Backend Setup

### 1. Install Dependencies
```bash
cd namma-scheme-backend
npm install
```

### 2. Configure Environment
Create `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/namma-scheme
PORT=8001
JWT_SECRET=your_secret_key_here
GOOGLE_API_KEY=your_google_api_key
NODE_ENV=development
```

### 3. Start Backend
```bash
npm start
```

Backend runs on: `http://localhost:8001`

## Frontend Setup

### 1. Install Dependencies
```bash
cd namma-scheme-frontend
npm install
```

### 2. Configure Environment
Create `.env` file:
```
VITE_API_URL=http://localhost:8001/api
```

### 3. Start Frontend
```bash
npm run dev
```

Frontend runs on: `http://localhost:5177`

## MongoDB Setup

### Local MongoDB
```bash
mongod
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env`

## Database Initialization

The backend automatically imports schemes from CSV on first run.

To manually import:
```bash
cd namma-scheme-backend
node import-schemes.js
```

## Verification

### Check Backend
```bash
curl http://localhost:8001/api/health
```

### Check Frontend
Open browser: `http://localhost:5177`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access (for Atlas)

### Port Already in Use
- Backend: Change PORT in `.env`
- Frontend: Vite will use next available port

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Build Frontend
```bash
cd namma-scheme-frontend
npm run build
```

Output: `dist/` folder

### Deploy Backend
- Use Node.js hosting (Heroku, Railway, Render)
- Set environment variables
- Connect to MongoDB Atlas

### Deploy Frontend
- Use static hosting (Vercel, Netlify, AWS S3)
- Update `VITE_API_URL` to production backend URL
