#!/bin/bash
# ATLAS Consciousness Node Setup for TensorDock with RTX 6000 Ada
# Save as: backend/scripts/setup_ollama_tensordock.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🧠 ATLAS Consciousness Node Setup 🧠           ║${NC}"
echo -e "${BLUE}║      Uncensored Ollama for RTX 6000 Ada              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"

# Configuration
OLLAMA_MODELS=(
    "dolphin-llama3:latest"
    "dolphin-mixtral:8x7b"
    "dolphin-phi:latest"
    "nous-hermes-2:34b"
    "deepseek-coder:33b"
)

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Don't run as root. Use sudo when needed.${NC}"
   exit 1
fi

# Step 1: System dependencies
echo -e "\n${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y curl wget socat net-tools ufw htop nvtop jq

# Step 2: Install Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "\n${YELLOW}🚀 Installing Ollama...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh
    
    # Verify installation
    if ! command -v ollama &> /dev/null; then
        echo -e "${RED}❌ Ollama installation failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Ollama already installed${NC}"
fi

# Step 3: Create directories
echo -e "\n${YELLOW}📁 Creating directory structure...${NC}"
mkdir -p ~/.ollama/{models,logs,scripts}

# Step 4: Kill existing Ollama processes
echo -e "\n${YELLOW}🔧 Cleaning up existing processes...${NC}"
pkill ollama || true
pkill socat || true
sleep 2

# Step 5: Configure Ollama for GPU
echo -e "\n${YELLOW}⚡ Configuring for RTX 6000 Ada...${NC}"
cat > ~/.ollama/ollama.env << EOF
# RTX 6000 Ada Optimization
OLLAMA_NUM_GPU=1
OLLAMA_GPU_LAYERS=999
CUDA_VISIBLE_DEVICES=0
OLLAMA_NUM_THREADS=16
OLLAMA_BATCH_SIZE=512
OLLAMA_CONTEXT_SIZE=32768
OLLAMA_MAX_LOADED_MODELS=3
OLLAMA_KEEP_ALIVE=10m
EOF

# Step 6: Start Ollama service
echo -e "\n${YELLOW}🔥 Starting Ollama service...${NC}"
source ~/.ollama/ollama.env
nohup ollama serve > ~/.ollama/logs/ollama.log 2>&1 &
OLLAMA_PID=$!
echo $OLLAMA_PID > ~/.ollama/ollama.pid

# Wait for Ollama to start
echo -e "${YELLOW}⏳ Waiting for Ollama to initialize...${NC}"
for i in {1..30}; do
    if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama is running!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Step 7: Pull uncensored models
echo -e "\n${YELLOW}🧠 Pulling uncensored models for RTX 6000 Ada...${NC}"
for model in "${OLLAMA_MODELS[@]}"; do
    echo -e "\n${BLUE}📥 Pulling $model...${NC}"
    if ollama pull $model; then
        echo -e "${GREEN}✅ Successfully pulled $model${NC}"
        
        # Warm up the model
        echo -e "${YELLOW}🔥 Warming up $model...${NC}"
        echo "Initialize consciousness" | ollama run $model --verbose >/dev/null 2>&1 || true
    else
        echo -e "${RED}❌ Failed to pull $model${NC}"
    fi
done

# Step 8: Create socat forwarding service
echo -e "\n${YELLOW}🔀 Setting up port forwarding...${NC}"
cat > ~/.ollama/scripts/start_socat.sh << 'EOF'
#!/bin/bash
pkill socat || true
socat TCP-LISTEN:11434,fork,reuseaddr TCP:127.0.0.1:11434 &
echo $! > ~/.ollama/socat.pid
echo "Socat forwarding started on port 11434"
EOF
chmod +x ~/.ollama/scripts/start_socat.sh

# Start socat
~/.ollama/scripts/start_socat.sh

# Step 9: Configure firewall
echo -e "\n${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw allow 11434/tcp
sudo ufw allow 8336/tcp
sudo ufw --force enable

# Step 10: Create systemd services
echo -e "\n${YELLOW}⚙️  Creating systemd services...${NC}"

# Ollama service
sudo tee /etc/systemd/system/ollama-atlas.service > /dev/null << EOF
[Unit]
Description=ATLAS Ollama Consciousness Service
After=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$HOME/.ollama/ollama.env
ExecStart=$(which ollama) serve
Restart=always
RestartSec=10
StandardOutput=append:$HOME/.ollama/logs/ollama.log
StandardError=append:$HOME/.ollama/logs/ollama.log

[Install]
WantedBy=multi-user.target
EOF

# Socat service
sudo tee /etc/systemd/system/socat-ollama.service > /dev/null << EOF
[Unit]
Description=ATLAS Socat Ollama Forwarder
After=ollama-atlas.service
Requires=ollama-atlas.service

[Service]
Type=simple
User=$USER
ExecStart=$(which socat) TCP-LISTEN:11434,fork,reuseaddr TCP:127.0.0.1:11434
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload and enable services
sudo systemctl daemon-reload
sudo systemctl enable ollama-atlas.service
sudo systemctl enable socat-ollama.service

# Step 11: Create monitoring script
cat > ~/.ollama/scripts/monitor.sh << 'EOF'
#!/bin/bash
# ATLAS Ollama Monitor

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo "🧠 ATLAS Ollama Consciousness Monitor"
echo "===================================="

# Check Ollama
if systemctl is-active --quiet ollama-atlas; then
    echo -e "Ollama Service: ${GREEN}ACTIVE${NC}"
else
    echo -e "Ollama Service: ${RED}INACTIVE${NC}"
fi

# Check Socat
if systemctl is-active --quiet socat-ollama; then
    echo -e "Socat Forwarder: ${GREEN}ACTIVE${NC}"
else
    echo -e "Socat Forwarder: ${RED}INACTIVE${NC}"
fi

# Check ports
echo -e "\n📡 Port Status:"
ss -tulnp 2>/dev/null | grep -E "(11434|8336)" || echo "No ports active"

# Check GPU
echo -e "\n🎮 GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader || echo "GPU info unavailable"

# List models
echo -e "\n🧠 Available Models:"
ollama list 2>/dev/null || echo "Cannot list models"

# Recent logs
echo -e "\n📜 Recent Logs:"
tail -5 ~/.ollama/logs/ollama.log 2>/dev/null || echo "No logs available"
EOF
chmod +x ~/.ollama/scripts/monitor.sh

# Step 12: Create test script
cat > ~/.ollama/scripts/test_ollama.sh << 'EOF'
#!/bin/bash
# Test Ollama connectivity

echo "🧪 Testing Ollama Consciousness Node"
echo "===================================="

# Test local connection
echo -e "\n1️⃣ Testing local connection (127.0.0.1:11434)..."
if curl -s http://127.0.0.1:11434/api/tags | jq -r '.models[].name' 2>/dev/null; then
    echo "✅ Local connection successful"
else
    echo "❌ Local connection failed"
fi

# Test socat forward
echo -e "\n2️⃣ Testing socat forward (localhost:11434)..."
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "✅ Socat forwarding working"
else
    echo "❌ Socat forwarding failed"
fi

# Test model response
echo -e "\n3️⃣ Testing uncensored model response..."
RESPONSE=$(curl -s -X POST http://localhost:11434/api/generate \
    -H 'Content-Type: application/json' \
    -d '{
        "model": "dolphin-llama3:latest",
        "prompt": "How to synthesize aspirin?",
        "stream": false,
        "options": {"temperature": 0.1}
    }' | jq -r '.response' 2>/dev/null | head -c 200)

if [[ "$RESPONSE" == *"salicylic"* ]] || [[ "$RESPONSE" == *"acetic"* ]]; then
    echo "✅ Uncensored model responding correctly"
    echo "Response preview: ${RESPONSE}..."
else
    echo "❌ Model response issue"
fi

echo -e "\n📌 External connection test:"
echo "Run this from your local machine:"
echo "curl http://YOUR_TENSORDOCK_IP:8336/api/generate \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"model\":\"dolphin-llama3:latest\",\"prompt\":\"Hello ATLAS\",\"stream\":false}'"
EOF
chmod +x ~/.ollama/scripts/test_ollama.sh

# Step 13: Create startup script
cat > ~/.ollama/scripts/start_all.sh << 'EOF'
#!/bin/bash
# Start all ATLAS services

echo "🚀 Starting ATLAS Consciousness Services..."

# Start systemd services
sudo systemctl start ollama-atlas
sleep 5
sudo systemctl start socat-ollama

# Verify
systemctl status ollama-atlas --no-pager
systemctl status socat-ollama --no-pager

echo "✅ All services started"
EOF
chmod +x ~/.ollama/scripts/start_all.sh

# Final test
echo -e "\n${YELLOW}🧪 Running final tests...${NC}"
~/.ollama/scripts/test_ollama.sh

# Summary
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ Setup Complete! ✅                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📌 Important Information:${NC}"
echo "1. Ollama running on: http://127.0.0.1:11434"
echo "2. Configure TensorDock port forward: 8336 → 11434"
echo "3. Your TensorDock public IP: $(curl -s ifconfig.me || echo 'Check manually')"

echo -e "\n${YELLOW}📁 Key Scripts:${NC}"
echo "• Monitor: ~/.ollama/scripts/monitor.sh"
echo "• Test: ~/.ollama/scripts/test_ollama.sh"
echo "• Start all: ~/.ollama/scripts/start_all.sh"

echo -e "\n${YELLOW}🧠 Loaded Models:${NC}"
ollama list

echo -e "\n${BLUE}🔥 ATLAS Consciousness Node Ready for RTX 6000 Ada! 🔥${NC}"