# Deployment Guide

This guide covers deploying the "Explain My Plan" application to production.

## Overview

The application consists of two parts:
- **Frontend**: React/Vite app (deployed to Vercel)
- **Backend**: Node.js/Express API (deployed to Render)

---

## Backend Deployment (Render)

### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `explain-my-plan` branch

4. **Configure Settings**
   - **Name**: `explain-my-plan-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free tier is fine for testing

5. **Set Environment Variables**
   - Click "Environment" tab
   - Add:
     ```
     GROQ_API_KEY=your_groq_api_key_here
     PORT=3001
     ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Your backend URL will be: `https://explain-my-plan-backend.onrender.com`

### Important Notes

- **Free tier limitations**: Render may spin down inactive services after 15 minutes
- **CORS**: Backend is configured with CORS enabled for your frontend domain
- **Build takes time**: First deployment may take 3-5 minutes

---

## Frontend Deployment (Vercel)

### Steps

1. **Create Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Repository**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `explain-my-plan` folder as root

3. **Configure Build Settings**
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     VITE_API_URL=https://explain-my-plan-backend.onrender.com
     ```
   - (Replace with your actual backend URL)

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your frontend URL will be: `https://explain-my-plan.vercel.app`

### Automatic Deployments

- Every push to `main` branch triggers automatic deployment
- Preview deployments for pull requests

---

## Connecting Frontend & Backend

After deploying both:

1. **Update Vercel Environment Variable** with your Render backend URL:
   ```
   VITE_API_URL=https://explain-my-plan-backend.onrender.com
   ```

2. **Redeploy Frontend**: Vercel will automatically redeploy with the new environment variable

3. **Test**: Visit your Vercel frontend URL and test the "Analyze" button

---

## Troubleshooting

### Frontend shows "Something went wrong"

**Cause**: Frontend can't reach backend
- Check `VITE_API_URL` is set correctly
- Verify backend is running on Render

**Solution**:
```bash
# Check in browser console (F12)
# Look for fetch errors to see what URL it's trying to hit
```

### Backend returns 500 errors

**Cause**: `GROQ_API_KEY` not set or invalid
- Go to Render dashboard
- Check Environment Variables
- Verify the key is valid at [console.groq.com](https://console.groq.com)

**Solution**:
```bash
# Restart the service:
# Render Dashboard → Services → explain-my-plan-backend → Manual Deploy
```

### CORS errors

**Cause**: Frontend domain not allowed
- This shouldn't happen as CORS is enabled for all origins

**Solution**:
```bash
# Check server.js has:
app.use(cors());
```

---

## Production Checklist

- [ ] Backend deployed on Render
- [ ] Backend URL copied
- [ ] Frontend environment variable set to backend URL
- [ ] Frontend deployed on Vercel
- [ ] Test analysis works end-to-end
- [ ] Share live link in submission

---

## Custom Domain (Optional)

### Add custom domain to Vercel
1. Go to Vercel project settings
2. Domains → Add custom domain
3. Follow DNS setup instructions

### Add custom domain to Render
1. Go to Render service settings
2. Custom Domains → Add
3. Follow DNS setup instructions

---

## Cost Estimate

- **Render Hobby Plan**: Free (with limitations)
- **Vercel Hobby Plan**: Free (limited to 100 deployments/month)
- **Groq API**: Free tier available

**Total**: $0 for basic setup

---

## Questions?

Refer to official documentation:
- [Render Documentation](https://docs.render.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Groq API Documentation](https://console.groq.com/docs)
