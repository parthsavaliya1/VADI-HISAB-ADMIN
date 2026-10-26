module.exports = {
  apps: [
    {
      name: 'vadi hisab admin',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
