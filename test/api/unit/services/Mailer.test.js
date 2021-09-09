const { expect } = require('chai');
const moment = require('moment');
const Mailer = require('../../../../api/services/mailer');
const Templates = require('../../../../api/services/mailer/templates');
const factory = require('../../support/factory');
const { hostname } = require('../../../../config').app;
const { Role, User, Site, OrganizationRole } = require('../../../../api/models');

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
      user = await factory.user();
    });

    const createSandboxOrg = async (sandboxNextCleaningAt) => {
      const org = await factory.organization.create({ sandboxNextCleaningAt, isSandbox: true });
      await org.addUser(user, { through: { roleId: managerRole.id } });
      const newUser = await factory.user();
      await org.addUser(newUser, { through: { roleId: userRole.id } });
      await factory.site({ organizationId: org.id });
      await factory.site({ organizationId: org.id });
      await factory.site({ organizationId: org.id });
      return org.reload({
        include: [
          {
            model: User,
            required: true,
          },
          {
            model: Site,
            required: true,
          },
        ],
      });
    };

    context('when the Mailer has been initialized', async () => {
      it('adds a `sandbox-reminder` job to the mail queue', async () => {
        const expiryDays = 5;
        const sandboxNextCleaningAt = moment().add(expiryDays, 'days');
        const dateStr = sandboxNextCleaningAt.format('MM-DD-YYYY');
        const org = await createSandboxOrg(sandboxNextCleaningAt.toDate());

        Mailer.init();
        const job = await Mailer.sendSandboxReminder(org);
        expect(job.name).to.eq('sandbox-reminder');
        org.Users.forEach(u => expect(job.data.to.split('; ')).include(u.email));
        expect(job.data.subject).to.eq(`Your Pages sandbox organization\'s sites will be removed in ${expiryDays} days`);
        expect(job.data.html).to.eq(Templates.sandboxReminder({
          organizationId: org.id, dateStr, organizationName: org.name, hostname, sites: org.Sites,
        }));
      });
    });
  });
});
