class MockSocket {
  constructor(userId = null) {
    if (userId) {
      this.user = userId;
    }

    const defaultUserRoom = `defaultUserRoom${Math.random() * 1000}`;
    const rooms = {};
    rooms[defaultUserRoom] = defaultUserRoom;
    this.rooms = rooms;
  }

  join(roomName) {
    this.rooms[roomName] = roomName;
  }
}

module.exports = MockSocket;
