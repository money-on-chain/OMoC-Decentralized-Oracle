module.exports = {
  apps : [{
    name: "Oracle" ,
    script: './delfos/oracle.sh',

    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    instances: process.env.Instances,
    instance_var: "InstanceID",
    autorestart: true,
    namespace: "Delfos",
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    log_date_format: "YYYY-MM-DD HH:mm Z"
  }]
};
