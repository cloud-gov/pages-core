const tap = require('tap');

const send = require('../src/send');

tap.test('It sends the metrics!', async (t) => {
  let sentMetrics;

  const nrClient = {
    async sendMetrics(metrics) {
      sentMetrics = metrics;
    },
  };

  const metrics = [
    {
      name: 'some.metric',
      type: 'gauge',
      value: 1,
      timestamp: Date.now(),
    },
  ];

  await send(metrics, { nrClient });

  t.same(sentMetrics, metrics, 'the provided metrics were sent');
});
