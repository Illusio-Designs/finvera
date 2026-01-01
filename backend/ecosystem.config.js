require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const path = require('path');
const fs = require('fs');

// Read .env file and parse it
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      // Skip comments and empty lines
      if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    });
  }
  
  return env;
}

const envVars = loadEnvFile();

module.exports = {
  apps: [{
    name: 'finvera-backend',
    script: './server.js',
    cwd: path.resolve(__dirname),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096 --expose-gc',
    env: {
      NODE_ENV: 'production',
      ...envVars, // Spread all environment variables from .env file
    },
    error_file: '/home/ubuntu/.pm2/logs/finvera-backend-error.log',
    out_file: '/home/ubuntu/.pm2/logs/finvera-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
  }]
};

