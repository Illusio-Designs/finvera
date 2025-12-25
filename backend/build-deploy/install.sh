#!/bin/bash
echo "Installing Finvera Backend..."
npm install --production
echo "Creating directories..."
mkdir -p logs uploads
chmod 777 logs uploads
echo "Ready! Create .env file next."
