# 🌐 GeoIntel.AI — Production Deployment & Hosting Blueprint

**System Architecture:** Unified React 18 + FastAPI + ChromaDB Vector Database + PyMuPDF Spatial Extraction + Groq LPU Inference.

---

## 📊 Platform Suitability Matrix

| Platform | Tier / Pricing | Persistent Disk | OCR / Tesseract | Difficulty | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Render** | Free tier (750 hrs/mo) / $7/mo | Yes (Persistent Disk) | ✅ Supported via Docker | ⭐ Easy | **Best for Clean 1-Click Cloud Demo** |
| **Railway** | $5 free trial credit, then ~$5/mo | Yes (Volume mount) | ✅ Supported via Docker | ⭐ Easy | **Best Developer Experience** |
| **Hugging Face Spaces** | **100% Free** (2 vCPU, 16 GB RAM) | Yes (Persistent Disk addon) | ✅ Supported via Docker | ⭐⭐ Moderate | **Best for Hackathon Evaluator Visibility** |
| **Cloud VPS (DigitalOcean / Hetzner)** | $4–$6 / month flat | Yes (Native NVMe) | ✅ Full OS control | ⭐⭐ Moderate | **Best for Production & Institutional Sovereign Deployments** |
| **GCP Cloud Run / AWS ECS** | Pay-per-request | Requires GCS / EFS mount | ✅ Supported via Docker | ⭐⭐⭐ Advanced | Best for Large Enterprise Scaling |
| **Vercel / Netlify** | Free | ❌ No | ❌ No | 🚫 Incompatible | **FastAPI + C libraries (Tesseract, PyMuPDF) cannot run** |

---

## 🚀 Option 1: Render.com (Recommended for SIH Demos)

Render natively detects the root `Dockerfile` and deploys both the frontend and backend in a single container.

### Step-by-Step Instructions:
1. **Sign in to Render:** Go to [render.com](https://render.com) and log in with GitHub (`Supremedev7`).
2. **Create New Web Service:**
   - Click **New +** → **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect `Supremedev7/GeoIntel.AI`.
3. **Configure Settings:**
   - **Name:** `geointel-ai`
   - **Region:** Singapore / Frankfurt / Oregon (choose closest to India, e.g., Singapore).
   - **Branch:** `main`
   - **Root Directory:** Leave blank (it uses the root `Dockerfile`).
   - **Environment:** `Docker`
   - **Instance Type:** `Free` or `Starter` ($7/mo recommended for zero spin-down).
4. **Environment Variables:**
   - Add Key: `GROQ_API_KEY` → Value: `gsk_your_groq_api_key_here`
   - Add Key: `PYTHONUNBUFFERED` → Value: `1`
5. **Persistent Disk (Optional for Free, Recommended for Starter):**
   - Under **Disks**, add a disk:
     - **Name:** `geointel-storage`
     - **Mount Path:** `/app/backend/storage`
     - **Size:** `1 GB` to `5 GB`
6. **Deploy:**
   - Click **Create Web Service**.
   - Render will build the Docker container (installing Node.js, compiling React, installing Python, Tesseract, and launching Uvicorn).
   - Your live URL will be: `https://geointel-ai.onrender.com`.

---

## ⚡ Option 2: Railway.app (Fastest 2-Minute Deployment)

Railway provides blazing-fast container builds and generous free usage credits.

### Step-by-Step Instructions:
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Supremedev7/GeoIntel.AI`.
4. Click **Deploy Now**. Railway will automatically detect the root `Dockerfile`.
5. **Set Environment Variables:**
   - In the project canvas, click on the service → **Variables**.
   - Add `GROQ_API_KEY` = your Groq API key.
   - Add `PORT` = `8000`.
6. **Generate Public Domain:**
   - Go to **Settings** → **Networking** → Click **Generate Domain**.
   - You will receive a URL like: `https://geointel-ai-production.up.railway.app`.
7. **Add Persistent Volume (to preserve vectors & reports):**
   - Click **+ New** → **Volume**.
   - Mount path: `/app/backend/storage`.

---

## 🤗 Option 3: Hugging Face Spaces (100% Free AI Showcase)

Hugging Face Spaces offers **free 2 vCPU and 16 GB RAM** container hosting. It is widely recognized and trusted by hackathon juries.

### Step-by-Step Instructions:
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and sign in.
2. Click **Create new Space**:
   - **Space Name:** `geointel-ai`
   - **License:** `mit` or `apache-2.0`
   - **SDK:** Select **Docker** (Blank).
   - **Space Hardware:** `CPU Basic • 2 vCPU • 16GB RAM` (Free).
3. In your Space's repository, add a remote or push your code:
   ```bash
   git remote add space https://huggingface.co/spaces/YOUR_HF_USERNAME/geointel-ai
   git push space main
   ```
4. **Set Secret:**
   - Go to Space **Settings** → **Variables and secrets**.
   - Add New Secret: `GROQ_API_KEY`.
5. Hugging Face builds your Dockerfile and serves the full UI in an embedded iframe and via direct URL.

---

## 🖥️ Option 4: Production Cloud VPS (Hetzner / DigitalOcean / AWS EC2)

For institutional deployments (CMPDI / Coal India intranet or sovereign cloud), deploy directly via Docker Compose on Ubuntu Linux.

### Requirements:
- Ubuntu 22.04 / 24.04 LTS VPS (1 vCPU, 2GB RAM minimum, e.g., Hetzner CX22 @ ~€3.79/mo or DigitalOcean Droplet @ $6/mo).

### Deployment Script:
```bash
# 1. Update system and install Docker
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and log back in, or run: newgrp docker

# 2. Clone GeoIntel.AI
git clone https://github.com/Supremedev7/GeoIntel.AI.git
cd GeoIntel.AI

# 3. Create .env file with your Groq API Key
cat << 'EOF' > .env
GROQ_API_KEY=gsk_your_groq_api_key_here
PYTHONUNBUFFERED=1
EOF

# 4. Launch with Docker Compose
docker compose up -d

# 5. Verify service is healthy
docker compose ps
curl http://localhost:8000/api/health
```

### Enable Free SSL (HTTPS) with Caddy / Nginx:
Install Caddy for automatic HTTPS in 30 seconds:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Edit /etc/caddy/Caddyfile:
# your-domain.com {
#     reverse_proxy localhost:8000
# }
sudo systemctl restart caddy
```

---

## 🔑 Key Operational Checkpoints

1. **Groq API Key:**
   - Get an API key from [console.groq.com](https://console.groq.com).
   - Set as `GROQ_API_KEY` in environment variables or input it dynamically inside the web interface (persisted securely in the browser's `localStorage`).
2. **Health Check Endpoint:**
   - All cloud platforms can ping `http://<host>:8000/api/health` to confirm container health and vector index readiness.
3. **Swagger / OpenAPI Documentation:**
   - Access complete interactive API endpoints at `http://<host>:8000/docs`.
