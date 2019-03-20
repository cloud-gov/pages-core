const { logger } = require('./winston');
const app = require('./app');

app.server.listen(process.env.PORT || 1337, () => {
  logger.info('Server running!');
});
