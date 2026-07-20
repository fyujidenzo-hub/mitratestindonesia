module.exports = {
  apps: [
    {
      name: "shopee-work",
      cwd: "./server",
      script: "dist/src/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
