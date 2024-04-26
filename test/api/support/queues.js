function promisedQueueEvents(queueEvents, event) {
  return new Promise((resolve) => {
    queueEvents.on(event, resolve);
  });
}

function promisedQueueAnyEvents(queueEvents, events) {
  return new Promise((resolve) => {
    events.forEach(event => queueEvents.on(event, resolve));
  });
}

module.exports = {
  promisedQueueEvents,
  promisedQueueAnyEvents,
};
