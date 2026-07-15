# Deployment Guide

## Backend Deployment

### Option 1: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create namma-scheme-backend`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=<your_atlas_uri>
   heroku config:set JWT_SECRET=<your_secret>
   heroku config:set GOOGLE_API_KEY=<your_key>
   ```
5. Deploy: `git push heroku main`

### Option 2: Railway

1. Connect GitHub repo
2. Add MongoDB service
3. Set environment variables
4. Deploy automatically

### Option 3: AWS EC2

1. Launch EC2 instance (Node.js AMI)
2. SSH into instance
3. Clone repository
4. Install dependencies: `npm install`
5. Set environment variables
6. Start with PM2: `pm2 start server.js`
7. Setup reverse proxy with Nginx

## Frontend Deployment

### Option 1: Vercel

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=<backend_url>`
5. Deploy automatically

### Option 2: Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable: `VITE_API_URL=<backend_url>`
5. Deploy

### Option 3: AWS S3 + CloudFront

1. Build: `npm run build`
2. Upload `dist/` to S3
3. Create CloudFront distribution
4. Set origin to S3 bucket
5. Update DNS to CloudFront

## Database

### MongoDB Atlas

1. Create cluster
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Update backend `.env`

## Environment Variables

### Backend Production
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/namma-scheme
PORT=8001
JWT_SECRET=<strong_random_secret>
GOOGLE_API_KEY=<your_key>
NODE_ENV=production
```

### Frontend Production
```
VITE_API_URL=https://api.namma-scheme.com
```

## SSL/HTTPS

- Use Let's Encrypt for free SSL
- Configure in Nginx/Apache
- Or use managed services (Heroku, Vercel, Netlify)

## Monitoring

- Setup error tracking (Sentry)
- Monitor performance (New Relic)
- Setup logging (CloudWatch, Loggly)

## Backup

- Enable MongoDB Atlas automated backups
- Regular database snapshots
- Version control for code

## Security Checklist

- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Setup CORS properly
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure headers
- [ ] Regular security updates
