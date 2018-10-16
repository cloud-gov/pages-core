const expect = require('chai').expect;
const factory = require('../../support/factory');
const SocketIOSubscriber = require('../../../../api/services/SocketIOSubscriber')
const MockSocket = require('../../support/mockSocket');

describe('SocketIOSubscriber', () => {
  context('listen', () => {
    it('a user with sites joinsRooms(socket)', (done) => {
      let user;
      let socket;

      factory.user()
        .then((model) => {
          user = model;
          return Promise.resolve();
        })
        .then(() => factory.site({ users: Promise.all([user]) }))
        .then(() => factory.site({ users: Promise.all([user]) }))
        .then(() => factory.site({ users: Promise.all([user]) }))
        .then(() => factory.site({ users: Promise.all([user]) }))
        .then(() => factory.site({ users: Promise.all([user]) }))
        .then(() => {
          socket = MockSocket.new(user.id);
          SocketIOSubscriber.joinRooms(socket);
          return Promise.resolve();
        })
        .then(() => {
          expect(socket.rooms.length).to.eql(6);
        });
      done();
    });

    it('a user without sites joinsRooms(socket)', (done) => {
      let socket;

      factory.site()
        .then(() => factory.user())
        .then((user) => {
          socket = MockSocket.new(user.id);
          SocketIOSubscriber.joinRooms(socket);
          return Promise.resolve();
        })
        .then(() => {
          expect(socket.rooms.length).to.eql(1);
        });
      done();
    });

    it('user 1 and user 2 have different sites', (done) => {
      let user1;
      let user2;
      let socket1;
      let socket2;

      factory.user()
        .then((model) => {
          user1 = model;
          return Promise.resolve();
        })
        .then(() => factory.site({ users: Promise.all([user1]) }))
        .then(() => factory.site({ users: Promise.all([user1]) }))
        .then(() => factory.site({ users: Promise.all([user1]) }))
        .then(() => factory.user())
        .then((model) => {
          user2 = model;
          return Promise.resolve();
        })
        .then(() => factory.site({ users: Promise.all([user2]) }))
        .then(() => {
          socket1 = MockSocket.new(user1.id);
          SocketIOSubscriber.joinRooms(socket1);

          socket2 = MockSocket.new(user2.id);
          SocketIOSubscriber.joinRooms(socket2);

          return Promise.resolve();
        })
        .then(() => {
          expect(socket1.rooms.length).to.eql(4);
          expect(socket2.rooms.length).to.eql(2);
        });
      done();
    });

    it('user 1 and user 2 have 2 same sites', (done) => {
      let user1;
      let user2;
      let socket1;
      let socket2;

      factory.user()
        .then((model) => {
          user1 = model;
          return Promise.resolve();
        })
        .then(() => factory.site({ users: Promise.all([user1]) }))
        .then(() => factory.site({ users: Promise.all([user1]) }))
        .then(() => factory.user())
        .then((model) => {
          user2 = model;
          return Promise.resolve();
        })
        .then(() => factory.site({ users: Promise.all([user2]) }))
        .then(() => factory.site({ users: Promise.all([user1, user2]) }))
        .then(() => factory.site({ users: Promise.all([user1, user2]) }))
        .then(() => {
          socket1 = MockSocket.new(user1.id);
          SocketIOSubscriber.joinRooms(socket1);

          socket2 = MockSocket.new(user2.id);
          SocketIOSubscriber.joinRooms(socket2);

          return Promise.resolve();
        })
        .then(() => {
          expect(socket1.rooms.length).to.eql(5);
          expect(socket2.rooms.length).to.eql(4);
          const allRooms = Object.assign(socket1.rooms, socket2.rooms);
          expect(allRooms.length).to.eql(7);
        });
      done();
    });
  });
});
