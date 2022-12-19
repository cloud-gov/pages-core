const { expect } = require('chai');
const { Event } = require('../../../api/models');

const cleanEvents = async () => await Event.destroy({ truncate: true })

const testAuthEvent = async (type, label, numOfEvents = 1) => {
  const events = await Event.findAll();

  expect(events.length).to.eq(numOfEvents)
  expect(events[0].type).to.eq(type)
  expect(events[0].label).to.eq(label)
}

module.exports = {
  cleanEvents,
  testAuthEvent
}
