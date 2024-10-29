const config = require('./config');

const postgres = config.postgres;

let url = 'postgres' + '://';

if (postgres.user) {
  url += postgres.user;
  if (postgres.password) {
    url += ':' + encodeURIComponent(postgres.password);
  }
  url += '@';
}
url += postgres.host || 'localhost';
if (postgres.port) {
  url += ':' + postgres.port;
}
if (postgres.database) {
  url += '/' + encodeURIComponent(postgres.database);
}

process.env.DATABASE_URL = url;
require('db-migrate/bin/db-migrate');
