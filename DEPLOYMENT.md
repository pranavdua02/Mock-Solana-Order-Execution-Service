# Deployment Guide

This application requires:
- Node.js runtime (long-running process)
- WebSocket support
- PostgreSQL database
- Redis instance

## Recommended Platforms

### 1. Render (Recommended - Easiest)

**Why Render?** Free tier available, easy setup, supports all requirements.

#### Option A: One-Click Deploy (Using render.yaml)

1. **Push your code to GitHub** (if not already done)

2. **Go to Render Dashboard** → New → Blueprint

3. **Connect your GitHub repository**

4. **Render will auto-detect `render.yaml`** and create:
   - Web service
   - PostgreSQL database
   - Redis instance
   - All environment variables

5. **Click "Apply"** - Render handles everything!

#### Option B: Manual Setup

1. **Create a Render account** at https://render.com

2. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Name: `order-execution-db`
   - Note the connection string

3. **Create Redis Instance:**
   - New → Redis
   - Name: `order-execution-redis`
   - Note the connection URL

4. **Deploy Web Service:**
   - New → Web Service
   - Connect your GitHub repository
   - Settings:
     - **Name**: `order-execution-api`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       ```
       NODE_ENV=production
       PORT=10000
       HOST=0.0.0.0
       REDIS_URL=<from Redis instance>
       PGHOST=<from PostgreSQL>
       PGPORT=5432
       PGDATABASE=<from PostgreSQL>
       PGUSER=<from PostgreSQL>
       PGPASSWORD=<from PostgreSQL>
       ORDER_QUEUE_NAME=order-execution
       ORDER_MAX_CONCURRENCY=10
       ORDER_MAX_PER_MINUTE=100
       WS_HEARTBEAT_INTERVAL_MS=10000
       DEX_ROUTE_DELAY_MS=2000
       DEX_PRICE_VARIATION_BPS=250
       ```

5. **Deploy** - Render will automatically build and deploy

**Public URL**: `https://order-execution-api.onrender.com`

---

### 2. Railway (Very Easy)

**Why Railway?** Simple setup, good free tier, automatic deployments.

#### Steps:

1. **Create Railway account** at https://railway.app

2. **New Project → Deploy from GitHub**
   - Railway will auto-detect `railway.json` if present

3. **Add PostgreSQL:**
   - New → Database → PostgreSQL
   - Railway auto-generates connection variables

4. **Add Redis:**
   - New → Database → Redis
   - Railway auto-generates connection variables

5. **Configure Environment Variables:**
   - Go to your service → Variables
   - Add:
     ```
     NODE_ENV=production
     PORT=${{PORT}}
     HOST=0.0.0.0
     REDIS_URL=${{REDIS_URL}}
     PGHOST=${{PGHOST}}
     PGPORT=${{PGPORT}}
     PGDATABASE=${{PGDATABASE}}
     PGUSER=${{PGUSER}}
     PGPASSWORD=${{PGPASSWORD}}
     ORDER_QUEUE_NAME=order-execution
     ORDER_MAX_CONCURRENCY=10
     ORDER_MAX_PER_MINUTE=100
     WS_HEARTBEAT_INTERVAL_MS=10000
     DEX_ROUTE_DELAY_MS=2000
     DEX_PRICE_VARIATION_BPS=250
     ```

6. **Deploy** - Railway auto-detects Node.js and deploys

**Public URL**: Railway provides a `.railway.app` domain

---

### 3. Fly.io (Best for WebSockets)

**Why Fly.io?** Excellent WebSocket support, global edge deployment.

#### Steps:

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Initialize app:**
   ```bash
   fly launch
   ```
   - Choose app name
   - Select region
   - Don't deploy yet

4. **Create `fly.toml`** (if not auto-generated):
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]

   [env]
     NODE_ENV = "production"
     PORT = "8080"
     HOST = "0.0.0.0"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http", "tls"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

5. **Create PostgreSQL:**
   ```bash
   fly postgres create --name order-execution-db
   fly postgres attach --app your-app-name order-execution-db
   ```

6. **Create Redis:**
   ```bash
   fly redis create --name order-execution-redis
   ```

7. **Set secrets:**
   ```bash
   fly secrets set REDIS_URL=<redis-url>
   fly secrets set PGHOST=<pg-host>
   fly secrets set PGPORT=5432
   fly secrets set PGDATABASE=<pg-db>
   fly secrets set PGUSER=<pg-user>
   fly secrets set PGPASSWORD=<pg-password>
   fly secrets set ORDER_QUEUE_NAME=order-execution
   fly secrets set ORDER_MAX_CONCURRENCY=10
   fly secrets set ORDER_MAX_PER_MINUTE=100
   fly secrets set WS_HEARTBEAT_INTERVAL_MS=10000
   fly secrets set DEX_ROUTE_DELAY_MS=2000
   fly secrets set DEX_PRICE_VARIATION_BPS=250
   ```

8. **Deploy:**
   ```bash
   fly deploy
   ```

**Public URL**: `https://your-app-name.fly.dev`

---

### 4. DigitalOcean App Platform

**Why DigitalOcean?** Reliable, good documentation, managed databases.

#### Steps:

1. **Create account** at https://cloud.digitalocean.com

2. **Create App:**
   - Apps → Create App → GitHub
   - Select repository

3. **Configure App:**
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `4000`

4. **Add PostgreSQL Database:**
   - Resources → Create Database → PostgreSQL
   - Attach to app

5. **Add Redis:**
   - Resources → Create Database → Redis
   - Attach to app

6. **Environment Variables:**
   - Add all variables from `.env.example`

7. **Deploy**

**Public URL**: DigitalOcean provides a `.ondigitalocean.app` domain

---

## Post-Deployment Checklist

1. ✅ Verify API endpoint: `https://your-url.com/api/orders/execute`
2. ✅ Test WebSocket connection
3. ✅ Check database migrations ran (check logs)
4. ✅ Test order submission
5. ✅ Verify WebSocket status updates
6. ✅ Check queue processing in logs

## Troubleshooting

### WebSocket not connecting?
- Ensure platform supports WebSocket upgrades
- Check firewall/proxy settings
- Verify `HOST=0.0.0.0` is set

### Database connection errors?
- Verify connection strings are correct
- Check database is accessible from app
- Ensure migrations ran (check startup logs)

### Queue not processing?
- Verify Redis connection
- Check Redis URL is correct
- Review worker logs for errors

## Free Tier Limits

- **Render**: 750 hours/month free, sleeps after 15min inactivity
- **Railway**: $5 free credit/month
- **Fly.io**: 3 shared VMs free
- **DigitalOcean**: $200 credit for 60 days (trial)

## Recommendation

**For this project, use Render** - it's the easiest to set up, has a good free tier, and supports all requirements out of the box.

