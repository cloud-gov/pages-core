const { expect } = require('chai');

const Mailer = require('../../../../api/services/mailer');
const Templates = require('../../../../api/services/mailer/templates');
const factory = require('../../support/factory');
const { hostname, sandboxDays } = require('../../../../config').app;
const { Role, User } = require('../../../../api/models');
const moment = require('moment');

describe('mailer', () => {
  describe('.sendUAAInvite()', () => {
    context('when the Mailer has not been initialized', () => {
      it('throws an error', async () => {
        const error = await Mailer.sendUAAInvite().catch(e => e);

        expect(error).to.be.an('error');
        expect(error.message).to.eq('Mail Queue is not initialized, did you forget to call `init()`?');
      });
    });

    context('when the Mailer has been initialized', async () => {
      it('adds a `uaa-invite` job to the mail queue', async () => {
        const email = 'foo@bar.gov';
        const link = 'https://foobar.gov';

        Mailer.init();
        const job = await Mailer.sendUAAInvite(email, link);

        expect(job.name).to.eq('uaa-invite');
        expect(job.data.to).to.eq(email);
        expect(job.data.html).to.eq(Templates.uaaInvite({ link }));
      });
    });
  });

  describe('.sendSandboxReminder()', () => {
    let user;
    let userRole;
    let managerRole;

    before(async () => {
      [userRole, managerRole] = await Promise.all([
        Role.findOne({ where: { name: 'user' } }),
        Role.findOne({ where: { name: 'manager' } }),
      ]);
    })

    beforeEach(async () => {
      user = await factory.user();
    });

    const createSandboxOrg = async (daysAgo) => {
      const createdAt = moment().subtract(daysAgo, 'days').toDate();
      const org = await factory.organization.create({ createdAt, sandboxCleanedAt: createdAt, isSandbox: true });
      await org.addUser(user, { through: { roleId: managerRole.id } });
      return await org.reload({ include: [User] });
    };

    context('when the Mailer has been initialized', async () => {
      it('adds a `sandbox-reminder` job to the mail queue', async () => {
        const expiryDays = 5;
        const dateStr = moment().add(expiryDays, 'day').format('MM-DD-YYYY');
        const org = await createSandboxOrg(sandboxDays - expiryDays);
        const organizationLink = `${hostname}/organizations/${org.id}`;

        Mailer.init();
        const job = await Mailer.sendSandboxReminder(org, hostname);

        expect(job.name).to.eq('sandbox-reminder');
        expect(job.data.to).to.eq(user.email);
        expect(job.data.subject).to.eq(`Your Pages sandbox organization\'s sites will be deleted in ${expiryDays} days`);
        expect(job.data.html).to.eq(Templates.sandboxReminder({ organizationLink, dateStr, organizationName: org.name }));
      });
    });
  });
});
