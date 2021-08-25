const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');

const factory = require('../../support/factory');
const { notifyOrganizations } = require('../../../../api/services/SandboxReminder');
const Mailer = require('../../../../api/services/mailer');
const { Organization, User, Site, Role, SiteUser, OrganizationRole, } = require('../../../../api/models');
const { sandboxDays,sandboxMaxNoticeDays, sandboxNoticeFrequency } = require('../../../../config').app;


const createSandboxOrgDaysRemaining = async (daysRemaining, createdAt = new Date()) => {
  const org = await factory.organization.create({
    isSandbox: true,
    sandboxCleanedAt: moment().subtract(sandboxDays - daysRemaining, 'days').toDate(),
    createdAt,
   });
   await factory.site({ organizationId: org.id });
   const user = await factory.user();
   const role = await Role.findOne({ where: { name: 'manager' } });
   await OrganizationRole.create({ userId: user.id, organizationId: org.id, roleId: role.id });
   return org;//.reload({ include: [User, Site] });
  }

describe('SandboxReminder', () => {
  let mailerSpy;
  beforeEach(() => {
    mailerSpy = sinon.spy(Mailer, 'sendSandboxReminder');
  });
  afterEach(async () => {
    Organization.truncate();
    sinon.restore();
  });
  
  it('notifies agencies every sandboxNoticeFrequency days within last sandboxMaxNoticeDays days', async () => {
    let org;
    let orgsToNotify = [];
    await createSandboxOrgDaysRemaining(0); // cleaning at end of day
    org = await createSandboxOrgDaysRemaining(sandboxNoticeFrequency);
    orgsToNotify.push(org.id);
    org = await createSandboxOrgDaysRemaining(2 * sandboxNoticeFrequency);
    orgsToNotify.push(org.id);
    await createSandboxOrgDaysRemaining((2 * sandboxNoticeFrequency) + 1);

    await notifyOrganizations();

    orgsToNotify = await Organization.findAll({
      where: {
        id: orgsToNotify,
      },
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

    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    orgsToNotify.forEach(o => expect(mailerSpy.args).to.deep.include([o]));
  });

  it('should not notify if not cleaning not on interval days', async () => {
    await createSandboxOrgDaysRemaining(sandboxNoticeFrequency - 1);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify organizations that are past schedule cleaning day', async () => {
    await createSandboxOrgDaysRemaining(-1 * sandboxNoticeFrequency);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.equal(true);
  });

  it('should not notify organizations that are not within notice window', async () => {
    await createSandboxOrgDaysRemaining(Math.floor((sandboxMaxNoticeDays + (2 * sandboxNoticeFrequency))/sandboxNoticeFrequency) * sandboxNoticeFrequency);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify organizations to be cleaned at EOD', async () => {
    await createSandboxOrgDaysRemaining(0);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify non-sandbox organizations', async () => {
    const createdAt = moment().subtract(sandboxDays - sandboxNoticeFrequency, 'days').toDate();
    await factory.organization.create({ createdAt });
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should notify sandbox organizations never cleaned', async () => {
    const org = await createSandboxOrgDaysRemaining(sandboxNoticeFrequency);
    await org.update({sandboxCleanedA: null});
    await notifyOrganizations();

    expect(mailerSpy.called).to.be.true;
  });

  it('do not notify if no users are in org', async () => {
    let org;
    let orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining(sandboxNoticeFrequency);
    orgsToNotify.push(org.id);
    // do not notify b/c no users in org
    org = await createSandboxOrgDaysRemaining(sandboxNoticeFrequency);
    await OrganizationRole.destroy({ where: { organizationId: org.id } });
    await notifyOrganizations();

    orgsToNotify = await Organization.findAll({
      where: {
        id: orgsToNotify,
      },
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
    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    orgsToNotify.forEach(o => expect(mailerSpy.args).to.deep.include([o]));
  });

  it('do not notify if no sites are in org', async () => {
    let org;
    let orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining(sandboxNoticeFrequency);
    orgsToNotify.push(org.id);
    // do not notify b/c no sites in org
    org = await createSandboxOrgDaysRemaining(sandboxNoticeFrequency);
    await Site.destroy({ where: { organizationId: org.id } });
    await notifyOrganizations();

    orgsToNotify = await Organization.findAll({
      where: {
        id: orgsToNotify,
      },
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
    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    orgsToNotify.forEach(o => expect(mailerSpy.args).to.deep.include([o]));
  });
});
