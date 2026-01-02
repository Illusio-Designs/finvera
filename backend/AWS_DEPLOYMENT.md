# AWS Deployment Guide with Key Pair

This guide explains how to deploy the Finvera backend to AWS EC2 using the provided key pair.

## Prerequisites

1. AWS EC2 instance running Ubuntu/Linux
2. Key pair file: `finvera-keypair.pem`
3. AWS CLI configured (optional, for S3 backups)
4. SSH access to the EC2 instance

## Step 1: Upload Key Pair to AWS

### Option A: Import Existing Key Pair to AWS

1. **Extract Public Key from Private Key:**
   ```bash
   # On your local machine
   ssh-keygen -y -f finvera-keypair.pem > finvera-keypair.pub
   ```

2. **Import Key Pair to AWS:**
   ```bash
   aws ec2 import-key-pair \
     --key-name finvera-keypair \
     --public-key-material fileb://finvera-keypair.pub \
     --region us-east-1
   ```

### Option B: Use Existing Key Pair

If the key pair is already in AWS:
1. Go to AWS Console → EC2 → Key Pairs
2. Verify `finvera-keypair` exists
3. If not, create a new key pair or import the existing one

## Step 2: Configure EC2 Instance Security Group

Ensure your EC2 instance security group allows:

- **SSH (Port 22)**: From your IP or specific IP range
- **HTTP (Port 80)**: From anywhere (0.0.0.0/0) if using HTTP
- **HTTPS (Port 443)**: From anywhere (0.0.0.0/0) for HTTPS
- **Custom TCP (Port 3000)**: From your load balancer or specific IPs

## Step 3: Connect to EC2 Instance

### On Windows (PowerShell):

```powershell
# Set proper permissions for the key file
icacls finvera-keypair.pem /inheritance:r /grant:r "$env:USERNAME`:F"

# Connect to EC2 instance
ssh -i backend/finvera-keypair.pem ubuntu@<EC2_INSTANCE_IP>
```

### On Linux/Mac:

```bash
# Set proper permissions
chmod 400 finvera-keypair.pem

# Connect to EC2 instance
ssh -i finvera-keypair.pem ubuntu@<EC2_INSTANCE_IP>
```

Replace `<EC2_INSTANCE_IP>` with your actual EC2 instance public IP or DNS name.

## Step 4: Deploy Application

### Option A: Using the Deployment Script

1. **Upload deployment script to EC2:**
   ```bash
   scp -i finvera-keypair.pem backend/deploy.sh ubuntu@<EC2_IP>:/home/ubuntu/
   ```

2. **Upload key pair file (if needed on server):**
   ```bash
   scp -i finvera-keypair.pem backend/finvera-keypair.pem ubuntu@<EC2_IP>:/home/ubuntu/.ssh/
   ```

3. **SSH into the instance and run deployment:**
   ```bash
   ssh -i finvera-keypair.pem ubuntu@<EC2_IP>
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Option B: Manual Deployment

1. **SSH into EC2 instance:**
   ```bash
   ssh -i finvera-keypair.pem ubuntu@<EC2_IP>
   ```

2. **Clone repository:**
   ```bash
   cd /opt
   sudo mkdir -p finvera-backend
   sudo chown -R ubuntu:ubuntu finvera-backend
   cd finvera-backend
   git clone https://github.com/Illusio-Designs/finvera.git .
   cd backend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create .env file** (use values from deploy.sh or your configuration)

5. **Run migrations:**
   ```bash
   npm run migrate
   ```

6. **Start with PM2:**
   ```bash
   pm2 start server.js --name finvera-backend
   pm2 save
   pm2 startup
   ```

## Step 5: Configure SSH Key for Git (Optional)

If you want to use SSH for git operations on the EC2 instance:

1. **Copy key to EC2:**
   ```bash
   scp -i finvera-keypair.pem backend/finvera-keypair.pem ubuntu@<EC2_IP>:/home/ubuntu/.ssh/id_rsa
   ```

2. **Set permissions on EC2:**
   ```bash
   ssh -i finvera-keypair.pem ubuntu@<EC2_IP>
   chmod 600 ~/.ssh/id_rsa
   ```

3. **Configure git to use SSH:**
   ```bash
   cd /opt/finvera-backend
   git remote set-url origin git@github.com:Illusio-Designs/finvera.git
   ```

## Step 6: Update AWS EC2 Instance with Key Pair

### Using AWS Console:

1. Go to **EC2 Dashboard** → **Instances**
2. Select your instance
3. Click **Actions** → **Security** → **Modify instance attributes**
4. Under **Key pair name**, select `finvera-keypair`
5. Click **Update**

### Using AWS CLI:

```bash
# Note: You cannot change the key pair of a running instance directly
# You need to create an AMI and launch a new instance with the key pair

# Create AMI from current instance
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "finvera-backend-$(date +%Y%m%d)" \
  --region us-east-1

# Launch new instance with key pair
aws ec2 run-instances \
  --image-id <AMI_ID> \
  --instance-type t3.medium \
  --key-name finvera-keypair \
  --security-group-ids <SECURITY_GROUP_ID> \
  --subnet-id <SUBNET_ID> \
  --region us-east-1
```

## Step 7: Verify Deployment

1. **Check server status:**
   ```bash
   ssh -i finvera-keypair.pem ubuntu@<EC2_IP>
   pm2 status
   pm2 logs finvera-backend
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Test from outside (if security group allows):**
   ```bash
   curl http://<EC2_IP>:3000/health
   ```

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure:
1. The `FRONTEND_URL` environment variable is set correctly
2. The `CORS_ORIGIN` environment variable includes all allowed origins
3. The `MAIN_DOMAIN` environment variable matches your domain
4. Check the updated CORS configuration in `src/config/cors.js`

### SSH Connection Issues

1. **Permission denied:**
   ```bash
   chmod 400 finvera-keypair.pem
   ```

2. **Key format issues:**
   - Ensure the key is in OpenSSH format
   - Convert if needed: `ssh-keygen -p -f finvera-keypair.pem`

3. **Security group not allowing SSH:**
   - Check EC2 Security Group rules
   - Ensure port 22 is open from your IP

### Git Access Issues

If git push/pull fails:
1. Use HTTPS instead of SSH: `git remote set-url origin https://github.com/Illusio-Designs/finvera.git`
2. Or configure SSH key properly on the server

## Security Best Practices

1. **Never commit the key pair file to git** (it's already in .gitignore)
2. **Use IAM roles** instead of access keys when possible
3. **Rotate keys regularly**
4. **Limit SSH access** to specific IP ranges
5. **Use AWS Systems Manager Session Manager** as an alternative to SSH
6. **Enable CloudTrail** for audit logging
7. **Use AWS Secrets Manager** for sensitive configuration

## Key Pair File Location

- **Local**: `backend/finvera-keypair.pem`
- **EC2 Instance**: `/home/ubuntu/.ssh/id_rsa` (if uploaded)
- **AWS Console**: EC2 → Key Pairs → `finvera-keypair`

## Next Steps

1. Set up SSL/TLS certificates (Let's Encrypt or AWS Certificate Manager)
2. Configure load balancer (Application Load Balancer)
3. Set up auto-scaling groups
4. Configure CloudWatch monitoring
5. Set up automated backups
6. Configure CI/CD pipeline

## Support

For issues or questions:
- Check application logs: `pm2 logs finvera-backend`
- Check system logs: `journalctl -u pm2-ubuntu`
- Review CORS configuration: `backend/src/config/cors.js`

