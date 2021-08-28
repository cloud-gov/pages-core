const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');

const factory = require('../../support/factory');
const { notifyOrganizations, cleanSandboxes } = require('../../../../api/services/SandboxHelper');
const Mailer = require('../../../../api/services/mailer');
const { Organization, User, Site, Role, SiteUser, OrganizationRole, } = require('../../../../api/models');
const { sandboxDays, sandboxNotices, sandboxNoticeDaysInterval } = require('../../../../config').app;
const SiteDestroyer = require('../../../../api/services/SiteDestroyer');


const createSandboxOrgDaysRemaining = async (noticeNum, createdAt = new Date()) => {
  const org = await factory.organization.create({
    isSandbox: true,
    sandboxCleanedAt: moment().subtract(sandboxDays - (sandboxNoticeDaysInterval * noticeNum), 'days').toDate(),
    createdAt,
   });
   await factory.site({ organizationId: org.id });
   const user = await factory.user();
   const role = await Role.findOne({ where: { name: 'manager' } });
   await OrganizationRole.create({ userId: user.id, organizationId: org.id, roleId: role.id });
   return org.reload({ include: [Site, User]});
  }

describe('notifyOrganizations', () => {
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
    let i;
    for(i = 1; i <= sandboxNotices; i += 1) {
      org = await createSandboxOrgDaysRemaining(i);
      orgsToNotify.push(org.id);
    }
    await createSandboxOrgDaysRemaining(i);
    await createSandboxOrgDaysRemaining(i + 1);

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
    await createSandboxOrgDaysRemaining(1.5);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify organizations that are past schedule cleaning day', async () => {
    await createSandboxOrgDaysRemaining(-1);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.equal(true);
  });

  it('should not notify organizations that are not within notice window', async () => {
    await createSandboxOrgDaysRemaining();
    await notifyOrganizations(sandboxNotices + 1);

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify organizations to be cleaned at EOD', async () => {
    await createSandboxOrgDaysRemaining(0);
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should not notify non-sandbox organizations', async () => {
    const org = await createSandboxOrgDaysRemaining(1);
    await org.update({ isSandbox: false });
    await notifyOrganizations();

    expect(mailerSpy.notCalled).to.be.true;
  });

  it('should notify sandbox organizations never cleaned', async () => {
    const createdAt = moment().subtract(sandboxDays - sandboxNoticeDaysInterval  , 'days').toDate();
    const org = await createSandboxOrgDaysRemaining(0, createdAt );
    await org.update({sandboxCleanedAt: null});
    await notifyOrganizations();

    expect(mailerSpy.called).to.be.true;
  });

  it('do not notify if no users are in org', async () => {
    let org;
    let orgsToNotify = [];
    org = await createSandboxOrgDaysRemaining(1);
    orgsToNotify.push(org.id);
    // do not notify b/c no users in org
    org = await createSandboxOrgDaysRemaining(1);
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
    org = await createSandboxOrgDaysRemaining(1);
    orgsToNotify.push(org.id);
    // do not notify b/c no sites in org
    org = await createSandboxOrgDaysRemaining(1);
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

describe('cleanSandboxes', () => {
  let destroyerStub;

  afterEach(async () => {
    Organization.truncate();
    sinon.restore();
  });

  it('should clean all sites for since last cleaned', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const org  = await createSandboxOrgDaysRemaining(-1);
    await factory.site({ organizationId: org.id });
    await org.reload({ include: [Site] });
    await cleanSandboxes();
    org.Sites.forEach(s => expect(destroyerStub.args).to.deep.include([s]));
  });

  it('should not clean sites for for non sandbox org', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const org  = await createSandboxOrgDaysRemaining(-1);
    org.update({ isSandbox: false })
    await factory.site({ organizationId: org.id });
    await org.reload({ include: [Site] });
    await cleanSandboxes();
    expect(destroyerStub.notCalled).to.be.true;
  });

  it('should clean all sites for since never cleaned', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const createdAt = moment().subtract(sandboxDays + 10, 'days').toDate();
    const org  = await createSandboxOrgDaysRemaining(0, createdAt);
    await org.update({ sandboxCleanedAt: null });
    await factory.site({ organizationId: org.id });
    await org.reload({ include: [Site] });
    await cleanSandboxes();
    org.Sites.forEach(s => expect(destroyerStub.args).to.deep.include([s]));
  });

  it('should not clean all non-sandbox sites for since never cleaned', async () => {
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite').resolves();
    const createdAt = moment().subtract(sandboxDays + 10, 'days').toDate();
    const org  = await createSandboxOrgDaysRemaining(0, createdAt);
    await org.update({ sandboxCleanedAt: null, isSandbox: false });
    await factory.site({ organizationId: org.id });
    await org.reload({ include: [Site] });
    await cleanSandboxes();
    expect(destroyerStub.notCalled).to.be.true;
  });

  it('should fail to clean all sites', async () => {
    let orgs = [];
    destroyerStub = sinon.stub(SiteDestroyer, 'destroySite');
    destroyerStub.onCall(0).rejects(new Error('because1'));
    destroyerStub.onCall(1).rejects(new Error('because2'));
    destroyerStub.onCall(2).rejects(new Error('because3'));
    destroyerStub.onCall(3).resolves(); // site for org 3

    const org  = await createSandboxOrgDaysRemaining(-1);
    await factory.site({ organizationId: org.id });
    orgs.push(await org.reload({ include: [Site] }));

    orgs.push(await createSandboxOrgDaysRemaining(-1));
    orgs.push(await createSandboxOrgDaysRemaining(-1));
    const results = await cleanSandboxes();
    expect(results.filter(r => r.reason).length).to.equal(2); // 2 orgs error
    orgs.forEach(o => o.Sites.forEach(s => expect(destroyerStub.args).to.deep.include([s])));
  });
})