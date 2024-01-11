const fs = require('node:fs');
const cfenv = require('cfenv');

const { APP_ENV } = process.env;
const fileName = 'database.json';

const baseConfig = {
  driver: 'pg',
  port: '5432',
  ssl: {
    rejectUnauthorized: false,
  },
  schema: 'public',
};

function main() {
  try {
    const appEnv = cfenv.getAppEnv();
    const creds = appEnv.getServiceCreds(`federalist-${APP_ENV}-rds`);

    const config = {
      production: {
        ...baseConfig,
        user: creds.username,
        password: creds.password,
        host: creds.host,
        database: creds.name,
        port: creds.port,
      },
    };

    const data = JSON.stringify(config);

    fs.writeFileSync(fileName, data);

    // eslint-disable-next-line
    console.log('\n\nCreated database configuration.\n\n');

    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line
    console.error('\n\n!!! ERROR CONFIGURING DATABASE MIGRATIONS !!!\n\n');
    // eslint-disable-next-line
    console.error(error);
    process.exit(1);
  }
}

main();
