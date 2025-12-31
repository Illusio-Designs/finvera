# Fix Node.js Installation Conflict

## Quick Fix (Run on EC2)

If you encounter the Node.js installation conflict, run these commands:

```bash
# Remove conflicting packages
sudo apt-get remove -y nodejs nodejs-doc libnode-dev libnode72
sudo apt-get purge -y nodejs nodejs-doc libnode-dev libnode72
sudo apt-get autoremove -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Then continue with deployment
cd ~/finvera/backend
./deploy.sh
```

## Or Continue Deployment

The deploy script has been updated to handle this automatically. Just pull the latest changes and run again:

```bash
cd ~/finvera/backend
git pull origin main
./deploy.sh
```

