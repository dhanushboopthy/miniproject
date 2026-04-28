# Docker Setup Guide - Anganwadi Smart Health Monitoring System

## 🐳 Database Location

The database is **MongoDB** running inside a Docker container. Configuration:
- **Service Name:** `mongodb` (inside Docker network)
- **Connection String:** `mongodb://admin:admin123@mongodb:27017/anganwadi?authSource=admin`
- **Username:** `admin`
- **Password:** `admin123`
- **Database Name:** `anganwadi`
- **Data Volume:** Persisted in `mongodb_data` Docker volume

---

## ✅ Quick Start

### 1. Prerequisites
```bash
# Install Docker and Docker Compose
# Ubuntu/Debian:
sudo apt-get install docker.io docker-compose -y
sudo usermod -aG docker $USER

# macOS:
brew install docker docker-compose

# Windows: Download Docker Desktop
```

### 2. Prepare Environment Variables
```bash
cd /home/dhanush/Study/MiniProject
cp .env.docker .env

# Edit .env with your actual API keys
nano .env
```

**Required API Keys to Add:**
- `OPENROUTER_API_KEY` - Get from https://openrouter.ai
- `FAST2SMS_API_KEY` - Get from https://fast2sms.com (optional)
- `SMTP_EMAIL` & SMTP_PASSWORD` - For email notifications (optional)

### 3. Start All Services
```bash
# Navigate to project root
cd /home/dhanush/Study/MiniProject

# Build and start containers (first time takes 2-3 minutes)
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

**Expected Output:**
```
NAME                     STATUS          PORTS
anganwadi-mongodb        Up (healthy)    0.0.0.0:27017->27017/tcp
anganwadi-backend        Up              0.0.0.0:8000->8000/tcp
anganwadi-frontend       Up              0.0.0.0:5173->5173/tcp
```

### 4. Access Services
- **API Documentation:** http://localhost:8000/docs
- **Frontend App:** http://localhost:5173
- **MongoDB (local client):** `mongodb://localhost:27017`

---

## 📊 Database Details

### Collections Created Automatically
1. **users** - User accounts with roles (admin, supervisor, worker, cdpo)
2. **children** - Child registrations
3. **growth_records** - Weight/height measurements
4. **nutrition_logs** - Diet information
5. **alerts** - Health alerts (SAM, MAM, etc.)
6. **notification_logs** - SMS/Email delivery tracking
7. **audit_logs** - System audit trail
8. **in_app_notifications** - Dashboard notifications

### Indexes Created for Performance
- Users: `email (unique)`, `role`, `awc_code`
- Children: `child_id (unique)`, `awc_code`, `date_of_birth`
- Growth Records: `child_id`, `measurement_date`, `status`
- Alerts: `child_id`, `status`, `created_at`, `severity`
- Audit Logs: `user_id`, `timestamp`, `action`

---

## 🛠️ Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mongodb
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose stop
```

### Restart Services
```bash
docker-compose restart backend
```

### Remove Everything (⚠️ Deletes database!)
```bash
docker-compose down -v
```

### Access MongoDB Shell
```bash
docker exec -it anganwadi-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin anganwadi
```

### View Database Collections
```bash
# Inside mongosh shell:
show collections
db.users.find().limit(5)
db.children.countDocuments()
```

### Rebuild Services (after code changes)
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Access Backend Shell
```bash
docker exec -it anganwadi-backend bash
python -m seed.demo_data  # Load demo data
```

---

## 🌐 API Endpoints

Once running, access the interactive API docs:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

**Example login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@icds.gov.in","password":"admin123"}'
```

---

## 📦 Demo Data Loading

Load realistic test dataset:

```bash
docker exec -it anganwadi-backend python -m seed.demo_data
```

**Creates:**
- 1 Admin user
- 5 Supervisors
- 10 Workers
- 5 AWC Centers
- 40+ Children
- 100+ Measurements

**Demo Login Credentials:**
```
Admin: admin@icds.gov.in / admin123
Supervisor: supervisor1@icds.gov.in / demo123
Worker: worker1@icds.gov.in / demo123
```

---

## 🔧 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGO_URI` | Database connection | `mongodb://admin:admin123@mongodb:27017/anganwadi?authSource=admin` |
| `JWT_SECRET` | Token signing key | Change to random string in production |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |
| `OPENROUTER_API_KEY` | Claude AI API access | Get from openrouter.ai |
| `FAST2SMS_API_KEY` | SMS notification service | Get from fast2sms.com |

---

## 🚀 Development Workflow

```bash
# Terminal 1: Watch containers
docker-compose logs -f

# Terminal 2: Make code changes (auto-reload enabled)
# Edit files in ./backend or ./frontend
# Changes auto-detected, services rebuild

# Terminal 3: Run commands if needed
docker exec -it anganwadi-backend pytest  # Run tests
```

---

## 📋 Troubleshooting

### MongoDB won't start
```bash
docker-compose logs mongodb
# Usually memory issue - ensure at least 2GB free disk space
```

### Backend can't connect to MongoDB
```bash
# Check connection string in .env
# Should be: mongodb://admin:admin123@mongodb:27017/anganwadi?authSource=admin
# NOT: mongodb://localhost:27017
```

### Frontend shows blank page
```bash
# Check VITE_API_BASE_URL is set correctly
# Ensure backend is healthy: http://localhost:8000/docs
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :8000      # Backend
sudo lsof -i :5173      # Frontend
sudo lsof -i :27017     # MongoDB

# Kill process (e.g., port 8000)
sudo kill -9 <PID>
```

### Reset Everything
```bash
docker-compose down -v              # Delete all data
docker system prune -a              # Clean up unused images
docker-compose up -d --build        # Fresh start
```

---

## 📚 Architecture

```
┌─────────────────────────────────────┐
│   React Frontend (Port 5173)        │
│   - PWA with offline support        │
│   - IndexedDB for offline data      │
└────────────┬────────────────────────┘
             │ HTTP/REST
┌────────────▼────────────────────────┐
│   FastAPI Backend (Port 8000)       │
│   - Async routes                    │
│   - JWT authentication              │
│   - Rate limiting                   │
│   - Audit logging                   │
└────────────┬────────────────────────┘
             │ Motor (Async)
┌────────────▼────────────────────────┐
│   MongoDB (Port 27017)              │
│   - 8 Collections                   │
│   - Auto indexes                    │
│   - Persistent storage              │
└─────────────────────────────────────┘
```

---

## 🔐 Security Notes

**Development Only:**
- All credentials in `.env.docker` are for development
- MongoDB runs with auth enabled but default credentials exposed
- JWT_SECRET is public placeholder

**For Production:**
- Change all secrets in `.env`
- Use MongoDB Atlas instead of local container
- Enable HTTPS for frontend
- Set restrictive CORS origins
- Use environment-specific `.env` files
- Never commit `.env` to git

---

## 📞 Support

For issues or questions about Docker setup:
1. Check logs: `docker-compose logs -f`
2. Verify services are healthy: `docker-compose ps`
3. Test connectivity: `curl http://localhost:8000/docs`
