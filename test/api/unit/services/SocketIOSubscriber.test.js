const { expect } = require('chai');
const factory = require('../../support/factory');
const SocketIOSubscriber = require('../../../../api/services/SocketIOSubscriber');
const MockSocket = require('../../support/mockSocket');
const { SiteUser } = require('../../../../api/models');

const times = (length, fn) => Array.from({ length }, fn);

describe('SocketIOSubscriber', () => {
  context('listen', () => {
    it('a user with sites joinsRooms(socket)', async () => {
      const numSites = 5;
      const user = await factory.user();
      await Promise.all(times(numSites, () => factory.site({ users: [user] })));
      const socket = new MockSocket(user);

      await SocketIOSubscriber.joinRooms(socket);

      expect(socket.rooms.size).to.eql(numSites + 1);
    });

    it('a user without sites joinsRooms(socket)', async () => {
      const user = await factory.user();
      const socket = new MockSocket(user);

      await SocketIOSubscriber.joinRooms(socket);

      expect(socket.rooms.size).to.eql(1);
    });

    it('user 1 and user 2 have different sites', async () => {
      const user1NumSites = 3;
      const user2NumSites = 1;
      const [user1, user2] = await Promise.all(times(2, () => factory.user()));
      await Promise.all([
        ...times(user1NumSites, () => factory.site({ users: [user1] })),
        ...times(user2NumSites, () => factory.site({ users: [user2] })),
      ]);
      const socket1 = new MockSocket(user1);
      const socket2 = new MockSocket(user2);

      await Promise.all([
        SocketIOSubscriber.joinRooms(socket1),
        SocketIOSubscriber.joinRooms(socket2),
      ]);

      expect(socket1.rooms.size).to.eql(user1NumSites + 1);
      expect(socket2.rooms.size).to.eql(user2NumSites + 1);
    });

    it('user 1 and user 2 have 2 same sites', async () => {
      const user1NumSites = 2;
      const user2NumSites = 1;
      const bothNumSites = 2;
      const [user1, user2] = await Promise.all(times(2, () => factory.user()));
      await Promise.all([
        ...times(user1NumSites, () => factory.site({ users: [user1] })),
        ...times(user2NumSites, () => factory.site({ users: [user2] })),
        ...times(bothNumSites, () => factory.site({ users: [user1, user2] })),
      ]);
      const socket1 = new MockSocket(user1);
      const socket2 = new MockSocket(user2);

      await Promise.all([
        SocketIOSubscriber.joinRooms(socket1),
        SocketIOSubscriber.joinRooms(socket2),
      ]);

      expect(socket1.rooms.size).to.eql(user1NumSites + bothNumSites + 1);
      expect(socket2.rooms.size).to.eql(user2NumSites + bothNumSites + 1);
      const allRooms = new Set([...socket1.rooms, ...socket2.rooms]);
      expect(allRooms.size).to.eql(user1NumSites + user2NumSites + bothNumSites + 2);
    });

    it('no user with sites joinsRooms(socket)', async () => {
      const numSites = 5;
      const user = await factory.user();
      await Promise.all(times(numSites, () => factory.site({ users: [user] })));
      const socket = new MockSocket();

      await SocketIOSubscriber.joinRooms(socket);

      expect(socket.rooms.size).to.eql(1);
    });

    it('a user with sites with 1 buildsOnly and 1 none subscription', async () => {
      const numSites = 4;
      const user = await factory.user();
      const [site1, site2] = await Promise.all(
        times(numSites, () => factory.site({ users: [user] }))
      );
      await Promise.all([
        SiteUser.update({ buildNotificationSetting: 'builds' },
          { where: { user_sites: user.id, site_users: site1.id } }),
        SiteUser.update({ buildNotificationSetting: 'none' },
          { where: { user_sites: user.id, site_users: site2.id } }),
      ]);
      const socket = new MockSocket(user);

      await SocketIOSubscriber.joinRooms(socket);

      expect(socket.rooms.size).to.eql(numSites - 1 + 1);
      expect([...socket.rooms].filter(room => room.endsWith(`user-${user.id}`)).length).to.eql(1);
    });
  });
});
