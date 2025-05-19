module.exports = {
  apps: [
    {
      name: "crowdpass-backend-dev",
      script: "./node_modules/.bin/ts-node-dev",
      args: "--respawn --transpile-only --require tsconfig-paths/register src/index.ts",
      autorestart: true,
      watch: false,
      restart_delay: 2000,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "crowdpass-backend",
      script: "./dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
