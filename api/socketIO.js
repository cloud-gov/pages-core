const io = require('socket.io');
const redis = require('redis');
const redisAdapter = require('socket.io-redis');

const { redis: redisConfig } = require('../config');
const { logger } = require('../winston');

const server = require('./server');
const SocketIOSubscriber = require('./services/SocketIOSubscriber');
const jwtHelper = require('./services/jwtHelper');

const socketIO = io(server, { cookie: false });

if (redisConfig) {
  const pubClient = redis.createClient(redisConfig);
  const subClient = redis.createClient(redisConfig);

  pubClient.on('error', (err) => {
    logger.error(`redisAdapter pubClient error: ${err}`);
  });
  subClient.on('error', (err) => {
    logger.error(`redisAdapter subClient error: ${err}`);
  });

  socketIO.adapter(redisAdapter({ pubClient, subClient }));

  socketIO.of('/').adapter.on('error', (err) => {
    logger.error(`redisAdapter error: ${err}`);
  });
}

socketIO.use((socket, next) => {
  /* eslint-disable no-param-reassign */
  if (socket.handshake.query && socket.handshake.query.accessToken) {
    jwtHelper.verify(socket.handshake.query.accessToken, { expiresIn: 60 * 60 * 24 }) // expire 24h
      .then((decoded) => {
        socket.user = decoded.user;
      })
      .then(() => next())
      .catch((e) => {
        logger.warn(e);
        next();
      });
  } else {
    next();
  }
});

socketIO.on('connection', (socket) => {
  SocketIOSubscriber.joinRooms(socket);
});

socketIO.on('error', (err) => {
  logger.error(`socket auth/subscribe error: ${err}`);
});

module.exports = socketIO;
