module.exports = {
  apps: [
    {
      name: 'sanctity-ferme-backend',
      script: './backend/server.js',
      cwd: './backend',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      // Auto restart settings
      watch: process.env.NODE_ENV === 'development',
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Logging
      log_file: './backend/logs/combined.log',
      out_file: './backend/logs/out.log',
      error_file: './backend/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Memory management
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Error handling
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Advanced features
      merge_logs: true,
      time: true
    },
    {
      name: 'sanctity-ferme-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Only run in production
      instances: process.env.NODE_ENV === 'production' ? 1 : 0,
      
      // Logging
      log_file: './logs/frontend.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      
      // Memory management
      max_memory_restart: '500M',
      
      // Error handling
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/sanctity-ferme-plant-tracker.git',
      path: '/var/www/sanctity-ferme',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};






