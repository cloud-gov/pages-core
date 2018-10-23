class MockSocket {
  constructor(session = {}) {
    this.request = { session };

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
