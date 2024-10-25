const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');

const factory = require('../../support/factory');
const { notifyOrganizations, cleanSandboxes } = require('../../../../api/services/SandboxHelper');
const QueueJobs = require('../../../../api/queue-jobs');
const { Organization, User, Site, Role, OrganizationRole } = require('../../../../api/models');
const { sandboxDays } = require('../../../../config').app;
const SiteDestroyer = require('../../../../api/services/SiteDestroyer');


const createSandboxOrgDaysRemaining = async (daysAway = 0, createdAt = new Date()) => {
  const managerRole = await Role.findOne({ where: { name: 'manager' } });
  const org = await factory.organization.create({
    isSandbox: true,
    sandboxNextCleaningAt: moment().add(daysAway, 'days').endOf('day').toDate(),
    createdAt,
  });
  await factory.site({ organizationId: org.id });
  const user = await factory.user();

  await OrganizationRole.create({
    userId: user.id,
    organizationId: org.id,
    roleId: managerRole.id,
  });
  return org.reload({ include: [Site, User] });
};

describe('notifyOrganizations', () => {
  let mailerSpy;
  let userRole;
  let managerRole;
  beforeEach(async () => {
    userRole = await Role.findOne({ where: { name: 'user' } });
    managerRole = await Role.findOne({ where: { name: 'manager' } });
    mailerSpy = sinon.spy(QueueJobs.prototype, 'sendSandboxReminder');
  });
  afterEach(async () => {
    Organization.truncate();
    sinon.restore();
  });
  const verifyOrgsVsArgs = async (orgIds, spyArgs) => {
    const orgsToNotify = await Organization.findAll({
      where: {
        id: orgIds,
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

    spyArgs.flat().map(o => expect(orgsToNotify
      .map(n => n.Users.filter(x => x.OrganizationRole.roleId === managerRole.id).map(u => u.id)))
      .to.eql(o.Users.map(v => v.id)));

    spyArgs.flat().map(o => expect(orgsToNotify.map(n => n.Sites.map(u => u.id)))
      .to.eql(o.Sites.map(v => v.id)));
  };

  it('includes UAA identities for users who have them', async () => {
    let org;
    const orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining();
    const user = org.Users[0];
    await factory.uaaIdentity({ userId: user.id });

    orgsToNotify.push(org.id);

    await notifyOrganizations(moment().toDate());

    expect(mailerSpy.callCount).to.equal(1);
    expect(mailerSpy.args[0][0].Users.length).to.equal(1);
    expect(mailerSpy.args[0][0].Users[0].id).to.equal(user.id);
    expect(mailerSpy.args[0][0].Users[0]).to.haveOwnProperty('UAAIdentity');
  });

  it('notifies agencies with schedule date', async () => {
    let org;
    const orgsToNotify = [];
    const sandboxNotices = 5;
    let i;
    for (i = 0; i < sandboxNotices; i += 1) {
      // eslint-disable-next-line
      org = await createSandboxOrgDaysRemaining();
      orgsToNotify.push(org.id);
    }
    await createSandboxOrgDaysRemaining(1);
    await createSandboxOrgDaysRemaining(1);

    await notifyOrganizations(moment().toDate());

    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    verifyOrgsVsArgs(orgsToNotify, mailerSpy.args);
  });

  it('should not notify if cleaning not on date requested', async () => {
    await createSandboxOrgDaysRemaining(1);
    await notifyOrganizations(new Date());

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify non-sandbox organizations', async () => {
    const org = await createSandboxOrgDaysRemaining();
    await org.update({ isSandbox: false });
    await notifyOrganizations(new Date());

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('do not notify if no users are in org', async () => {
    let org;
    const orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining();
    orgsToNotify.push(org.id);
    org = await createSandboxOrgDaysRemaining();
    orgsToNotify.push(org.id);
    // do not notify b/c no users in org
    org = await createSandboxOrgDaysRemaining();
    await OrganizationRole.destroy({ where: { organizationId: org.id } });
    await notifyOrganizations(new Date());

    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    verifyOrgsVsArgs(orgsToNotify, mailerSpy.args);
  });

  it('do not notify if no sites are in org', async () => {
    let org;
    const orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining();
    orgsToNotify.push(org.id);
    org = await createSandboxOrgDaysRemaining();
    orgsToNotify.push(org.id);
    // do not notify b/c no sites in org
    org = await createSandboxOrgDaysRemaining();
    await Site.destroy({ where: { organizationId: org.id } });
    await notifyOrganizations(new Date());

    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    verifyOrgsVsArgs(orgsToNotify, mailerSpy.args);
  });

  it('should only notify organization managers', async () => {
    let org;
    const orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining();
    orgsToNotify.push(org.id);

    org = await createSandboxOrgDaysRemaining();
    const regUser = await factory.user();
    await org.addUser(regUser, { through: { roleId: userRole.id } });
    orgsToNotify.push(org.id);
    // }
    org = await createSandboxOrgDaysRemaining();

    await OrganizationRole.update({
      roleId: userRole.id,
    },
    {
      where: {
        organizationId: org.id,
      },
    });

    await notifyOrganizations(moment().toDate());

    expect(mailerSpy.callCount).to.equal(2);
    expect(mailerSpy.callCount).to.equal(orgsToNotify.length);
    verifyOrgsVsArgs(orgsToNotify, mailerSpy.args);
  });
});

describe('cleanSandboxes', () => {
  let destroyerStub;

  afterEach(async () => {
    Organization.truncate();
    sinon.restore();
  });

  it('should clean all sites for since last cleaned', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const now = new Date();
    const org = await createSandboxOrgDaysRemaining(-1);
    await factory.site({ organizationId: org.id });
    await org.reload({ include: [Site] });
    expect(moment(org.sandboxNextCleaningAt).format('YYYY-MM-DD')).to.equal(moment(now).subtract(1, 'day').format('YYYY-MM-DD'));
    await cleanSandboxes(now);
    org.Sites.forEach(s => expect(destroyerStub.args).to.deep.include([s]));
    await org.reload();
    expect(moment(org.sandboxNextCleaningAt).format('YYYY-MM-DD')).to.equal(moment(now).add(sandboxDays, 'days').format('YYYY-MM-DD'));
  });

  it('should not clean sites for for non sandbox org', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const org = await createSandboxOrgDaysRemaining(-1);
    org.update({ isSandbox: false });
    await factory.site({ organizationId: org.id });
    await cleanSandboxes(new Date());
    expect(destroyerStub.notCalled).to.be.true;
  });

  it('should not clean all sites for org w/o cleaning date', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const org = await createSandboxOrgDaysRemaining(-1);
    org.update({ sandboxNextCleaningAt: null });
    await factory.site({ organizationId: org.id });
    await cleanSandboxes(new Date());
  });

  it('should fail to clean all sites', async () => {
    const orgs = [];
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite');
    destroyerStub.onCall(0).rejects(new Error('because1'));
    destroyerStub.onCall(1).rejects(new Error('because2'));
    destroyerStub.onCall(2).rejects(new Error('because3'));
    destroyerStub.onCall(3).resolves(); // site for org 3

    const org = await createSandboxOrgDaysRemaining(-1);
    await factory.site({ organizationId: org.id });
    orgs.push(await org.reload({ include: [Site] }));

    orgs.push(await createSandboxOrgDaysRemaining(-1));
    orgs.push(await createSandboxOrgDaysRemaining(-1));
    const results = await cleanSandboxes(new Date());
    expect(results.filter(r => r.reason).length).to.equal(2); // 2 orgs error
    orgs.forEach(o => o.Sites.forEach(s => expect(destroyerStub.args).to.deep.include([s])));
  });
});
