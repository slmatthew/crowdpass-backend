module.exports = {
  apps: [
    {
      name: "crowdpass-backend",
      script: "./node_modules/.bin/ts-node-dev",
      args: "--respawn --transpile-only --require tsconfig-paths/register src/index.ts",
      autorestart: true,
      watch: false,
      restart_delay: 2000,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};