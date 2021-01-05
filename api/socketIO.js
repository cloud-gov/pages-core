const io = require('socket.io');
const redis = require('redis');
const redisAdapter = require('socket.io-redis');

const { redis: redisConfig } = require('../config');
const { Event } = require('./models');
const EventCreator = require('./services/EventCreator');

const server = require('./server');
const SocketIOSubscriber = require('./services/SocketIOSubscriber');
const jwtHelper = require('./services/jwtHelper');

const socketIO = io(server);

if (redisConfig) {
  const pubClient = redis.createClient(redisConfig);
  const subClient = redis.createClient(redisConfig);

  pubClient.on('error', (err) => {
    EventCreator.error(Event.labels.SOCKET_IO, {
      message: 'redisAdapter pubClient error',
      error: err.stack,
    });
  });
  subClient.on('error', (err) => {
    EventCreator.error(Event.labels.SOCKET_IO, {
      message: 'redisAdapter subClient error',
      error: err.stack,
    });
  });

  socketIO.adapter(redisAdapter({ pubClient, subClient }));

  socketIO.of('/').adapter.on('error', (err) => {
    EventCreator.error(Event.labels.SOCKET_IO, {
      message: 'redisAdapter error',
      error: err.stadck,
    });
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
      .catch((err) => {
        EventCreator.error(Event.labels.SOCKET_IO, {
          message: 'handshake error',
          error: err.stack,
        });
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
  EventCreator.error(Event.labels.SOCKET_IO, {
    message: 'socket auth/subscribe error',
    error: err.stack,
  });
});

module.exports = socketIO;
