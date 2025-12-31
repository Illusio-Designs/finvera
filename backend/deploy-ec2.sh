#!/bin/bash
# =================================
# Quick Deploy Script for EC2
# Copy this entire command and run on EC2
# =================================

# This is the complete deployment command ready to use
# Just copy everything below and paste into your EC2 terminal

# Set these environment variables before running
# export RDS_PASSWORD="your-rds-password"
# export AWS_ACCESS_KEY_ID="your-access-key"
# export AWS_SECRET_ACCESS_KEY="your-secret-key"

RDS_ENDPOINT="finvera-mysql-db.cefq60scawxf.us-east-1.rds.amazonaws.com" \
RDS_USER="finvera_admin" \
RDS_PASSWORD="${RDS_PASSWORD}" \
RDS_DB="finvera_db" \
AWS_REGION="us-east-1" \
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
S3_BUCKET="finvera-backend-storage" \
MAIN_DOMAIN="finvera.solutions" \
API_DOMAIN="api.finvera.solutions" \
FRONTEND_URL="https://client.finvera.solutions" \
./deploy.sh

