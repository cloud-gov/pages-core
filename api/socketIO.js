const io = require('socket.io');
const redis = require('redis');
const redisAdapter = require('@socket.io/redis-adapter');

const { redis: redisConfig } = require('../config');
const { Event } = require('./models');
const EventCreator = require('./services/EventCreator');

const server = require('./server');
const SocketIOSubscriber = require('./services/SocketIOSubscriber');
const jwtHelper = require('./services/jwtHelper');

const socketIO = io(server);

function handleError(message, body = {}) {
  return err => EventCreator.error(Event.labels.SOCKET_IO, err, {
    message,
    ...body,
  });
}

if (redisConfig) {
  const pubClient = redis.createClient(redisConfig);
  const subClient = pubClient.duplicate();

  pubClient.on('error', handleError('redisAdapter pubClient error'));
  subClient.on('error', handleError('redisAdapter subClient error'));

  socketIO.adapter(redisAdapter(pubClient, subClient));

  socketIO.of('/').adapter.on('error', handleError('redisAdapter error'));
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
        handleError('handshake error')(err);
        next();
      });
  } else {
    next();
  }
});

socketIO.on('connection', (socket) => {
  SocketIOSubscriber
    .joinRooms(socket)
    .catch(handleError('socketIO subscription join room error', { userId: socket.user }));
});

socketIO.on('error', handleError('socket auth/subscribe error'));

module.exports = socketIO;
