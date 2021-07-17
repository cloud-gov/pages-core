/* eslint-disable no-console */
const Mailer = require('../api/workers/Mailer');

async function sendEmail(to, subject, html) {
  const mailer = new Mailer();
  const info = await mailer.send({ to, subject, html });
  console.log(info.message);
}

const [,, to, subject, html] = process.argv;

sendEmail(to, subject, html)
  .catch(console.error);
