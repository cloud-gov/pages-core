/* eslint-disable no-console */
const moment = require('moment');
const { Op } = require('sequelize');
const { Build } = require('../api/models');
const Mailer = require('../api/workers/Mailer');

const [,, EMAIL_TO, MINUTES] = process.argv;
const BUILD_QUEUED_MINUTES = MINUTES || 3;
const EMAIL_SUBJECT = `ALERT ${process.env.CF_SPACE}: Site Builds Still Queued`;

async function checkQueuedBuilds() {
  const date = new Date();
  const now = moment(date);
  const buildQueueTime = now.clone().subtract(BUILD_QUEUED_MINUTES, 'minutes');

  const options = {
    attributes: ['id'],
    where: {
      [Op.or]: [
        {
          state: Build.States.Queued,
          startedAt: {
            [Op.lt]: buildQueueTime.toDate(),
          },
        },
      ],
    },
    returning: ['id'],
  };

  const builds = await Build.findAll(options);
  return builds.map(b => b.id);
}

function createBodyHTML(buildIds) {
  const stringIds = buildIds.join(', ');

  return `
    <h1>Attention:</h1>
    <p>
      The following builds have been queued for
      beyond ${BUILD_QUEUED_MINUTES} minutes.
    </p>
    </br>
    <p>${stringIds}</p>
    </br>
    <p>
      Please check the admin dashboard and
      bull board to diagnose the delays.
    </p>
  `;
}

async function sendEmail(to, subject, html) {
  const mailer = new Mailer();
  const info = await mailer.send({ to, subject, html });
  console.log(info.message);
}

async function runCheck() {
  const buildIds = await checkQueuedBuilds();

  if (buildIds.length === 0) return null;

  const html = createBodyHTML(buildIds);
  return sendEmail(EMAIL_TO, EMAIL_SUBJECT, html);
}

runCheck()
  .then(() => process.exit())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
