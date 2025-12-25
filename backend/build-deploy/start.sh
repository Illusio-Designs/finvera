#!/bin/bash
echo "Starting Finvera..."
if command -v pm2 &> /dev/null; then
    pm2 start server.js --name finvera-backend
    pm2 save
else
    node server.js
fi
