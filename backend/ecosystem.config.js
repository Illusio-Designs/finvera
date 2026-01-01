const path = require('path');
const fs = require('fs');

// Read .env file and parse it
function loadEnvFile() {
  // Try multiple possible locations for .env file
  const possiblePaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env'),
    '/opt/finvera-backend/backend/.env',
    '/home/ubuntu/finvera/backend/.env',
  ];
  
  let envPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      envPath = possiblePath;
      break;
    }
  }
  
  const env = {};
  
  if (!envPath) {
    console.error(`[PM2 Config] ⚠️  .env file not found in any of these locations:`);
    possiblePaths.forEach(p => console.error(`[PM2 Config]   - ${p}`));
    console.error(`[PM2 Config] Current working directory: ${process.cwd()}`);
    console.error(`[PM2 Config] __dirname: ${__dirname}`);
    return env;
  }
  
  console.log(`[PM2 Config] ✓ Found .env file at: ${envPath}`);
  console.log(`[PM2 Config] Parsing .env file...`);
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  let loadedCount = 0;
  
  envContent.split('\n').forEach((line, index) => {
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
        loadedCount++;
      }
    }
  });
  
  console.log(`[PM2 Config] ✓ Loaded ${loadedCount} environment variables from .env file`);
  
  // Log critical variables (without sensitive values)
  const criticalVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'MASTER_DB_NAME', 'NODE_ENV', 'PORT'];
  criticalVars.forEach(key => {
    if (env[key]) {
      const value = key.includes('PASSWORD') ? '***' : env[key];
      console.log(`[PM2 Config]   ${key}=${value}`);
    } else {
      console.log(`[PM2 Config]   ${key}=NOT SET`);
    }
  });
  
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

