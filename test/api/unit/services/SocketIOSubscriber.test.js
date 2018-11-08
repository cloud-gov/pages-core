const expect = require('chai').expect;
const factory = require('../../support/factory');
const SocketIOSubscriber = require('../../../../api/services/SocketIOSubscriber');
const MockSocket = require('../../support/mockSocket');
const { SiteUser } = require('../../../../api/models');

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
          socket = new MockSocket(user.id);
          return SocketIOSubscriber.joinRooms(socket);
        })
        .then(() => {
          expect(Object.keys(socket.rooms).length).to.eql(6);
          done();
        })
        .catch(done);
    });

    it('a user without sites joinsRooms(socket)', (done) => {
      let socket;

      factory.site()
        .then(() => factory.user())
        .then((user) => {
          socket = new MockSocket(user.id);
          return SocketIOSubscriber.joinRooms(socket);
        })
        .then(() => {
          expect(Object.keys(socket.rooms).length).to.eql(1);
          done();
        })
        .catch(done);
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
          socket1 = new MockSocket(user1.id);

          socket2 = new MockSocket(user2.id);

          return Promise.all([
            SocketIOSubscriber.joinRooms(socket1),
            SocketIOSubscriber.joinRooms(socket2),
          ]);
        })
        .then(() => {
          expect(Object.keys(socket1.rooms).length).to.eql(4);
          expect(Object.keys(socket2.rooms).length).to.eql(2);
          done();
        })
        .catch(done);
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
          socket1 = new MockSocket(user1.id);
          socket2 = new MockSocket(user2.id);

          return Promise.all([
            SocketIOSubscriber.joinRooms(socket1),
            SocketIOSubscriber.joinRooms(socket2),
          ]);
        })
        .then(() => {
          expect(Object.keys(socket1.rooms).length).to.eql(5);
          expect(Object.keys(socket2.rooms).length).to.eql(4);
          const allRooms = Object.assign(socket1.rooms, socket2.rooms);
          expect(Object.keys(allRooms).length).to.eql(7);
          done();
        })
        .catch(done);
    });

    it('no id user with sites joinsRooms(socket)', (done) => {
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
          socket = new MockSocket();
          return SocketIOSubscriber.joinRooms(socket);
        })
        .then(() => {
          expect(Object.keys(socket.rooms).length).to.eql(1);
          done();
        })
        .catch(done);
    });

    it('a user with sites with 1 buildsOnly  and 1 none subscription', (done) => {
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
        .then(site => SiteUser.update({ buildNotify: 'builds' },
            { where: { user_sites: user.id, site_users: site.id } }))
        .then(() => factory.site({ users: Promise.all([user]) }))
        .then(site => SiteUser.update({ buildNotify: 'none' },
            { where: { user_sites: user.id, site_users: site.id } }))
        .then(() => {
          socket = new MockSocket(user.id);
          return SocketIOSubscriber.joinRooms(socket);
        })
        .then(() => {
          const rooms = Object.keys(socket.rooms);
          expect(rooms.length).to.eql(4);
          expect(rooms.filter(room => room.endsWith(`user-${user.id}`)).length).to.eql(1);
          done();
        })
        .catch(done);
    });
  });
});
