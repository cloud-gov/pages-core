/* eslint-disable no-console */
const Mailer = require('../api/services/Mailer');

async function sendEmail(to, subject, content) {
  const mailer = new Mailer();
  const info = await mailer.send(to, subject, content);
  console.log(info.message);
}

const [,, to, subject, content] = process.argv;

sendEmail(to, subject, content)
  .catch(console.error);
