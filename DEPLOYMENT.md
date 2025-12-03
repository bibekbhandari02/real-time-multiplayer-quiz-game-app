# Deployment Guide for Render

## Prerequisites
1. GitHub account
2. Render account (sign up at https://render.com)
3. MongoDB Atlas account (for database)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Step 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Render access
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

## Step 3: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to https://dashboard.render.com
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file
5. Set the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A random secure string (e.g., generate with: `openssl rand -base64 32`)
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `CLIENT_URL`: Your Render app URL (e.g., `https://your-app.onrender.com`)
6. Click "Apply" to deploy

### Option B: Manual Setup

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: trivianva-app
   - **Environment**: Node
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (same as Option A)
6. Click "Create Web Service"

## Step 4: Environment Variables

Set these in Render Dashboard → Your Service → Environment:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-random-secret-key
GEMINI_API_KEY=your-gemini-api-key
CLIENT_URL=https://your-app.onrender.com
PORT=10000
```

**Optional** (if you want to use Redis):
```
REDIS_URL=your-redis-url
```

## Step 5: Update Client API URL

The client is already configured to use relative URLs (`/api/...`), so it will automatically work with your Render deployment.

## Step 6: Test Your Deployment

1. Wait for the build to complete (5-10 minutes)
2. Visit your Render URL
3. Test:
   - Registration/Login
   - Creating a room
   - Joining a game
   - Real-time features (Socket.io)

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### Database Connection Issues
- Verify MongoDB Atlas connection string
- Check if IP whitelist includes 0.0.0.0/0
- Ensure database user has correct permissions

### Socket.io Not Working
- Verify `CLIENT_URL` environment variable is set correctly
- Check CORS settings in `server/index.js`

### App Crashes on Start
- Check logs in Render dashboard
- Verify all required environment variables are set
- Check for missing dependencies

## Free Tier Limitations

Render free tier:
- App sleeps after 15 minutes of inactivity
- 750 hours/month of runtime
- First request after sleep takes ~30 seconds

To keep app awake:
- Upgrade to paid plan ($7/month)
- Use a service like UptimeRobot to ping your app every 14 minutes

## Updating Your App

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. Render will automatically rebuild and deploy

## Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domain"
3. Add your domain
4. Update DNS records as instructed
5. Update `CLIENT_URL` environment variable

## Monitoring

- View logs: Render Dashboard → Your Service → Logs
- Check metrics: Render Dashboard → Your Service → Metrics
- Set up alerts: Render Dashboard → Your Service → Notifications

## Cost Optimization

Free tier is sufficient for:
- Development/testing
- Small user base (<100 concurrent users)
- Portfolio projects

Consider upgrading when:
- You need 24/7 uptime
- You have >100 concurrent users
- You need faster cold starts
