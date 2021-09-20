class MockSocket {
  constructor(user = null) {
    this.request = {};
    this.rooms = new Set([`defaultUserRoom${Math.random() * 1000}`]);

    if (user) {
      this.request.user = user;
    }
  }

  join(roomName) {
    this.rooms.add(roomName);
  }
}

module.exports = MockSocket;
