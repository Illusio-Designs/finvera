#!/bin/bash
# AWS EC2 Setup Script for Finvera Backend
# Run this script on your EC2 instance after connecting via SSH

set -e  # Exit on error

echo "🚀 Starting Finvera Backend Setup on AWS EC2..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo yum update -y

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install Git
echo -e "${YELLOW}📦 Installing Git...${NC}"
sudo yum install -y git

# Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi

# Install MySQL Client (optional, for testing)
echo -e "${YELLOW}📦 Installing MySQL Client...${NC}"
sudo yum install -y mysql

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo yum install -y nginx
else
    echo "Nginx already installed"
fi

# Verify installations
echo -e "${GREEN}✅ Installation Summary:${NC}"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Git: $(git --version)"
echo "PM2: $(pm2 --version)"
echo "MySQL Client: $(mysql --version 2>/dev/null || echo 'Installed')"
echo "Nginx: $(nginx -v 2>&1)"

# Create app directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p ~/finvera
cd ~/finvera

# Check if repository already exists
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Repository already exists. Pulling latest changes...${NC}"
    git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    read -p "Enter your GitHub repository URL (or press Enter for default): " REPO_URL
    REPO_URL=${REPO_URL:-"https://github.com/Illusio-Designs/finvera.git"}
    git clone $REPO_URL .
fi

# Navigate to backend
cd backend

# Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install --production

# Create uploads directory
echo -e "${YELLOW}📁 Creating uploads directory...${NC}"
mkdir -p uploads logs
chmod 755 uploads logs

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    echo "Please create .env file manually with your configuration."
    echo "You can use AWS_ENV_TEMPLATE.txt as a reference."
    echo ""
    echo "Run: nano .env"
    echo "Then paste your configuration from AWS_ENV_TEMPLATE.txt"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Setup PM2
echo -e "${YELLOW}⚙️  Setting up PM2...${NC}"
pm2 startup systemd -u $USER --hp $HOME
echo -e "${GREEN}✅ PM2 startup configured${NC}"
echo -e "${YELLOW}⚠️  Run the command shown above with sudo to enable auto-start on reboot${NC}"

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'finvera-backend',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=4096 --expose-gc'
  }]
};
EOF

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Create .env file: nano .env (use AWS_ENV_TEMPLATE.txt as reference)"
echo "2. Update .env with your RDS endpoint and credentials"
echo "3. Start the application: pm2 start ecosystem.config.js"
echo "4. Save PM2: pm2 save"
echo "5. Check status: pm2 status"
echo "6. View logs: pm2 logs finvera-backend"
echo ""
echo -e "${YELLOW}📚 For detailed instructions, see: AWS_DEPLOYMENT_GUIDE.md${NC}"

