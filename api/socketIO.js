const { Server } = require('socket.io');
const redis = require('redis');
const redisAdapter = require('@socket.io/redis-adapter');
const session = require('express-session');

const { redis: redisConfig } = require('../config');
const { Event } = require('./models');
const EventCreator = require('./services/EventCreator');
const SocketIOSubscriber = require('./services/SocketIOSubscriber');
const passport = require('./services/passport');
const sessionConfig = require('./init/sessionConfig');

let socketIO;

function handleError(message, body = {}) {
  return (err) =>
    EventCreator.error(Event.labels.SOCKET_IO, err, {
      message,
      ...body,
    });
}

const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

function init(server) {
  socketIO = new Server(server);

  if (redisConfig) {
    const pubClient = redis.createClient(redisConfig);
    const subClient = pubClient.duplicate();

    pubClient.on('error', handleError('redisAdapter pubClient error'));
    subClient.on('error', handleError('redisAdapter subClient error'));

    socketIO.adapter(redisAdapter(pubClient, subClient));

    socketIO.of('/').adapter.on('error', handleError('redisAdapter error'));
  }

  socketIO.use(wrap(session(sessionConfig)));
  socketIO.use(wrap(passport.initialize()));
  socketIO.use(wrap(passport.session()));

  socketIO.use((socket, next) => {
    if (socket.request.user) {
      next();
    } else {
      next(new Error('unauthorized'));
    }
  });

  socketIO.on('connection', (socket) => {
    SocketIOSubscriber.joinRooms(socket).catch(
      handleError('socketIO subscription join room error', {
        userId: socket.request.user?.id,
      }),
    );
  });

  socketIO.on('error', handleError('socket auth/subscribe error'));
}

function getSocket() {
  return socketIO;
}

module.exports = {
  getSocket,
  init,
};
