const { expect } = require('chai');
const { Event } = require('../../../api/models');

const cleanEvents = async () => await Event.destroy({ truncate: true })

const testAuthEvent = async (type, label, message) => {
  const event = await Event.findOne({ where: { label, type } });

  expect(event.type).to.eq(type)
  expect(event.label).to.eq(label)
  expect(event.body.message).to.equal(message)
  return await event.destroy({ force: true })
}

module.exports = {
  cleanEvents,
  testAuthEvent
}
