const { expect } = require('chai');
const sinon = require('sinon');

const { Domain, Build, Site, SiteBranchConfig } = require('../../../../api/models');
const { domain: DomainFactory, site: SiteFactory } = require('../../support/factory');
const DnsService = require('../../../../api/services/Dns');
const DomainService = require('../../../../api/services/Domain');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const { DomainQueue } = require('../../../../api/queues');
const config = require('../../../../config');
const { siteViewOrigin } = require('../../../../api/utils/site');
// eslint-disable-next-line max-len
const SourceCodePlatformHelper = require('../../../../api/services/SourceCodePlatformHelper');

describe('Domain Service', () => {
  before(DomainFactory.truncate);
  afterEach(() => {
    sinon.restore();
    return DomainFactory.truncate();
  });

  describe('.buildDnsRecords()', () => {
    it('returns an array of dns records from domain.names', () => {
      const domainNames = ['agency.gov', 'www.agency.gov'];

      const domain = DomainFactory.build({
        names: domainNames.join(','),
      });

      const result = DomainService.buildDnsRecords(domain);

      expect(result).to.deep.have.members([
        ...DnsService.buildDnsRecords(domainNames[0]),
        ...DnsService.buildDnsRecords(domainNames[1]),
      ]);
    });
  });

  describe('.canProvision()', () => {
    it('returns true if domain is pending and dns results can be provisioned', () => {
      const domain = DomainFactory.build();
      const dnsResults = [];
      sinon.stub(DnsService, 'canProvision').returns(true);

      const result = DomainService.canProvision(domain, dnsResults);

      expect(result).to.be.true;
    });

    it('returns false if the domain is not pending', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioned,
      });
      const dnsResults = [];
      sinon.stub(DnsService, 'canProvision').returns(true);

      const result = DomainService.canProvision(domain, dnsResults);

      expect(result).to.be.false;
    });

    it('returns false if dns records cannot be provisioned', () => {
      const domain = DomainFactory.build();
      const dnsResults = [];
      sinon.stub(DnsService, 'canProvision').returns(false);

      const result = DomainService.canProvision(domain, dnsResults);

      expect(result).to.be.false;
    });
  });

  describe('.canDeprovision()', () => {
    it('returns true if domain is provisioned', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioned,
      });

      const result = DomainService.canDeprovision(domain);

      expect(result).to.be.true;
    });

    it('returns true if domain is provisioning', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioning,
      });

      const result = DomainService.canDeprovision(domain);

      expect(result).to.be.true;
    });

    it('returns true if domain is failed', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Failed,
      });

      const result = DomainService.canDeprovision(domain);

      expect(result).to.be.true;
    });

    it('returns false if the domain is pending', () => {
      const domain = DomainFactory.build();

      const result = DomainService.canDeprovision(domain);

      expect(result).to.be.false;
    });
  });

  describe('.canDestroy()', () => {
    it('returns false if domain is provisioned', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioned,
      });

      const result = DomainService.canDestroy(domain);

      expect(result).to.be.false;
    });

    it('returns false if domain is provisioning', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioning,
      });

      const result = DomainService.canDestroy(domain);

      expect(result).to.be.false;
    });

    it('returns false if domain is failed', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Failed,
      });

      const result = DomainService.canDestroy(domain);

      expect(result).to.be.false;
    });

    it('returns false if domain is deprovisioning', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Deprovisioning,
      });

      const result = DomainService.canDestroy(domain);

      expect(result).to.be.false;
    });

    it('returns true if the domain is pending', () => {
      const domain = DomainFactory.build();

      const result = DomainService.canDestroy(domain);

      expect(result).to.be.true;
    });
  });

  describe('.checkDeprovisionStatus()', () => {
    it('does nothing if the domain is not deprovisioning', async () => {
      sinon.spy(CloudFoundryAPIClient.prototype, 'fetchServiceInstances');
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create();

      await DomainService.checkDeprovisionStatus(domain.id);

      sinon.assert.notCalled(CloudFoundryAPIClient.prototype.fetchServiceInstances);
      sinon.assert.notCalled(DomainQueue.prototype.add);
    });

    it(`updates the state to pending and
        keeps origin values of domain if the service no longer exists`, async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstances').resolves({
        resources: [],
      });
      sinon.spy(DomainQueue.prototype, 'add');

      const origin = 'foo.sites.pages.cloud.gov';
      const path = '/some/site/path';
      const serviceName = 'www.agency.gov-ext';

      const domain = await DomainFactory.create({
        origin,
        path,
        serviceName,
        state: Domain.States.Deprovisioning,
      });

      await DomainService.checkDeprovisionStatus(domain.id);

      await domain.reload();

      expect(domain.state).to.eq(Domain.States.Pending);
      expect(domain.origin).to.equal(origin);
      expect(domain.path).to.equal(path);
      expect(domain.serviceName).to.equal(serviceName);
      sinon.assert.notCalled(DomainQueue.prototype.add);
    });

    it('updates the associated site if the service no longer exists', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstances').resolves({
        resources: [],
      });
      sinon.spy(DomainQueue.prototype, 'add');
      const siteUpdateSpy = sinon.spy(DomainService, 'rebuildAssociatedSite');

      const domain = await DomainFactory.create({
        origin: 'foo.sites.pages.cloud.gov',
        path: '/some/site/path',
        serviceName: 'www.agency.gov-ext',
        state: Domain.States.Deprovisioning,
      });

      await DomainService.checkDeprovisionStatus(domain.id);

      await domain.reload({
        include: [SiteBranchConfig],
      });

      sinon.assert.notCalled(DomainQueue.prototype.add);
      sinon.assert.calledOnceWithExactly(
        siteUpdateSpy,
        domain,
        SourceCodePlatformHelper.flows.FLOW__DOMAIN_DEPROV,
      );
    });

    it('requeues the job if the service still exists', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstances').resolves({
        resources: [{}],
      });
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        state: Domain.States.Deprovisioning,
      });

      await DomainService.checkDeprovisionStatus(domain.id);

      await domain.reload();

      expect(domain.state).to.eq(Domain.States.Deprovisioning);
      sinon.assert.calledOnceWithExactly(
        DomainQueue.prototype.add,
        'checkDeprovisionStatus',
        {
          id: domain.id,
        },
      );
    });
  });

  describe('.checkAcmeChallengeDnsRecord', () => {
    it('checks the Acme Challenge Dns record for each domain name', async () => {
      sinon.stub(DnsService, 'checkAcmeChallengeDnsRecord').resolves();

      const domainNames = ['agency.gov', 'www.agency.gov'];
      const domain = await DomainFactory.create({
        names: domainNames.join(','),
      });

      await DomainService.checkAcmeChallengeDnsRecord(domain);

      sinon.assert.calledTwice(DnsService.checkAcmeChallengeDnsRecord);
      domainNames.forEach((domainName) => {
        sinon.assert.calledWithExactly(
          DnsService.checkAcmeChallengeDnsRecord,
          domainName,
        );
      });
    });
  });

  describe('.checkDnsRecords()', () => {
    it('checks the Dns records for each domain names', async () => {
      sinon.stub(DnsService, 'checkDnsRecords').resolves();

      const domainNames = ['agency.gov', 'www.agency.gov'];
      const domain = await DomainFactory.create({
        names: domainNames.join(','),
      });

      await DomainService.checkDnsRecords(domain);

      sinon.assert.calledTwice(DnsService.checkDnsRecords);
      domainNames.forEach((domainName) => {
        sinon.assert.calledWithExactly(DnsService.checkDnsRecords, domainName);
      });
    });
  });

  describe('.checkProvisionStatus()', () => {
    it('does nothing if the domain is not `provisioning`', async () => {
      sinon.spy(CloudFoundryAPIClient.prototype, 'fetchServiceInstance');
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        state: Domain.States.Failed,
      });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload();

      sinon.assert.notCalled(CloudFoundryAPIClient.prototype.fetchServiceInstance);
      sinon.assert.notCalled(DomainQueue.prototype.add);
      expect(domain.state).to.eq(Domain.States.Failed);
    });

    it('sets the domain state to `provisioned` if successful', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance').resolves({
        last_operation: {
          state: 'succeeded',
        },
      });
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        state: Domain.States.Provisioning,
      });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName,
      );
      sinon.assert.notCalled(DomainQueue.prototype.add);
      expect(domain.state).to.eq(Domain.States.Provisioned);
    });

    it('updates the associated site if successful', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance').resolves({
        last_operation: {
          state: 'succeeded',
        },
      });
      sinon.spy(DomainQueue.prototype, 'add');
      const siteUpdateSpy = sinon.spy(DomainService, 'rebuildAssociatedSite');

      const domain = await DomainFactory.create({
        state: Domain.States.Provisioning,
      });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload({
        include: [SiteBranchConfig],
      });

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName,
      );
      sinon.assert.notCalled(DomainQueue.prototype.add);
      sinon.assert.calledOnceWithExactly(
        siteUpdateSpy,
        domain,
        SourceCodePlatformHelper.flows.FLOW____DOMAIN_PROV,
      );
    });

    it('sets the domain state to `failed` if failed', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance').resolves({
        last_operation: {
          state: 'failed',
        },
      });
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        state: Domain.States.Provisioning,
      });

      const error = await DomainService.checkProvisionStatus(domain.id).catch((e) => e);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName,
      );
      sinon.assert.notCalled(DomainQueue.prototype.add);
      expect(domain.state).to.eq(Domain.States.Failed);
      expect(error).to.be.an('Error');
    });

    it('requeues the status check otherwise', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance').resolves({
        last_operation: {
          state: 'something else',
        },
      });
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        state: Domain.States.Provisioning,
      });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName,
      );
      sinon.assert.calledOnceWithExactly(
        DomainQueue.prototype.add,
        'checkProvisionStatus',
        {
          id: domain.id,
        },
      );
      expect(domain.state).to.eq(Domain.States.Provisioning);
    });
  });

  describe('.rebuildAssociatedSite()', () => {
    it(`triggers a rebuild on its associated site
        with matching domain name`, async () => {
      const site = await SiteFactory({
        domain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
        state: Domain.States.Provisioning,
      });

      await site.reload({
        include: [Build],
      });
      expect(site.Builds).to.have.length(0);

      await domain.reload({
        include: [SiteBranchConfig],
      });
      await DomainService.rebuildAssociatedSite(
        domain,
        SourceCodePlatformHelper.flows.FLOW____DOMAIN_PROV,
      );

      await site.reload({
        include: [Build],
      });
      expect(site.Builds).to.have.length(1);
      expect(site.Builds[0].branch).to.equal(site.defaultBranch);
    });

    it(`triggers a rebuild on its associated
        site with matching demo domain name`, async () => {
      const site = await SiteFactory({
        demoDomain: 'https://www.agency.gov',
        demoBranch: 'demo',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
        context: Domain.Contexts.Demo,
        state: Domain.States.Provisioning,
      });

      await site.reload({
        include: [Build],
      });
      expect(site.Builds).to.have.length(0);

      await domain.reload({
        include: [SiteBranchConfig],
      });
      await DomainService.rebuildAssociatedSite(
        domain,
        SourceCodePlatformHelper.flows.FLOW____DOMAIN_PROV,
      );

      await site.reload({
        include: [Build],
      });
      expect(site.Builds).to.have.length(1);
      expect(site.Builds[0].branch).to.equal(site.demoBranch);
    });
  });

  describe('.isSiteUrlManagedByDomain()', () => {
    it(`reports a domain-managed site live URL
        when the URL matches a site-context domain`, async () => {
      const site = await SiteFactory({
        domain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Site))
        .to.be.true;
    });

    it(`reports a domain-managed site demo URL
        when the URL matches a demo-context domain`, async () => {
      const site = await SiteFactory({
        demoDomain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
        context: Domain.Contexts.Demo,
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Demo))
        .to.be.true;
    });

    it(`reports a domain-managed site live URL
        when the site live URL is null`, async () => {
      const site = await SiteFactory({
        domain: null,
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Site))
        .to.be.true;
    });

    it(`reports a domain-managed site demo URL
        when the site demo URL is null`, async () => {
      const site = await SiteFactory({
        demoDomain: null,
        demoBranch: 'demo',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
        context: Domain.Contexts.Demo,
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Demo))
        .to.be.true;
    });

    it(`reports a domain-managed site live URL
        when the URL matches a first site-context domain name`, async () => {
      const site = await SiteFactory({
        domain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov,www.foo.gov,www.bar.gov',
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Site))
        .to.be.true;
    });

    it(`reports a domain-managed site live URL
        when the URL matches a first demo-context domain name`, async () => {
      const site = await SiteFactory({
        demoDomain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov,www.foo.gov,www.bar.gov',
        context: Domain.Contexts.Demo,
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Demo))
        .to.be.true;
    });

    it(`reports a domain-managed site live URL
        when the URL matches a non-first site-context domain name`, async () => {
      const site = await SiteFactory({
        domain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.foo.gov,www.agency.gov,www.bar.gov',
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Site))
        .to.be.true;
    });

    it(`reports a domain-managed site live URL
        when the URL matches a non-first demo-context domain name`, async () => {
      const site = await SiteFactory({
        demoDomain: 'https://www.agency.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.foo.gov,www.agency.gov,www.bar.gov',
        context: Domain.Contexts.Demo,
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Demo))
        .to.be.true;
    });

    it(`reports a non domain-managed site live URL
        when the URL does not match a site-context domain name`, async () => {
      const site = await SiteFactory({
        domain: 'https://www.example.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Site))
        .to.be.false;
    });

    it(`reports a non domain-managed site demo URL
        when the URL does not match a demo-context domain name`, async () => {
      const site = await SiteFactory({
        demoDomain: 'https://www.example.gov',
      });
      const domain = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
        context: Domain.Contexts.Demo,
      });
      await domain.reload({
        include: [Site],
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [domain], Domain.Contexts.Demo))
        .to.be.false;
    });

    it(`reports a non domain-managed site URL
        when an empty domain array is offered for evaluation`, async () => {
      const site = await SiteFactory({
        domain: 'https://www.example.gov',
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [], 'site')).to.be.false;
    });

    it(`reports a non domain-managed demo URL
        when an empty domain array is offered for evaluation`, async () => {
      const site = await SiteFactory({
        demoDomain: 'https://www.example.gov',
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [], 'demo')).to.be.false;
    });

    it(`reports a domain-managed site URL when URL is null even
        if an empty domain array is offered for evaluation`, async () => {
      const site = await SiteFactory({
        domain: null,
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [], 'site')).to.be.true;
    });

    it(`reports a domain-managed demo URL when URL is null even
        if an empty domain array is offered for evaluation`, async () => {
      const site = await SiteFactory({
        demoDomain: null,
      });

      expect(DomainService.isSiteUrlManagedByDomain(site, [], 'demo')).to.be.true;
    });
  });

  describe('.deprovision()', () => {
    it('throws if the domain cannot be deprovisioned', async () => {
      const domain = DomainFactory.build();

      const error = await DomainService.deprovision(domain).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(
        "Only 'provisioning', 'provisioned', or 'failed' domains can be deprovisioned.",
      );
    });

    it(`deletes the service instance, sets the domain to \`deprovisioning\`
        and queues the status check`, async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'deleteServiceInstance').resolves();
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        state: Domain.States.Provisioning,
      });

      await DomainService.deprovision(domain);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.deleteServiceInstance,
        domain.serviceName,
      );
      sinon.assert.calledOnceWithExactly(
        DomainQueue.prototype.add,
        'checkDeprovisionStatus',
        {
          id: domain.id,
        },
      );
      expect(domain.state).to.eq(Domain.States.Deprovisioning);
    });
  });

  describe('.destroy()', () => {
    it(`throws an error and does not destroy the domain
        if the domain is not \`pending\``, async () => {
      const domain = await DomainFactory.create({
        state: Domain.States.Provisioning,
      });

      const error = await DomainService.destroy(domain).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq("Only 'pending' domains can be destroyed.");
      expect(domain.isSoftDeleted()).to.be.false;
    });

    it('destroys the domain if it is `pending`', async () => {
      const domain = await DomainFactory.create();

      await DomainService.destroy(domain);

      expect(domain.isSoftDeleted()).to.be.true;
    });
  });

  describe('.provision()', () => {
    it('throws if the domain cannot be provisioned', async () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioned,
      });
      const dnsResults = [];

      const error = await DomainService.provision(domain, dnsResults).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq("Only 'pending' domains can be provisioned.");
    });

    it('throws if the dns records do not include an Acme Challenge record', async () => {
      const domain = DomainFactory.build();
      const dnsResults = [];

      const error = await DomainService.provision(domain, dnsResults).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(
        'There must be at least one Acme Challenge DNS record provided',
      );
    });

    it('throws if the dns records are not set', async () => {
      const domain = DomainFactory.build({
        names: 'www.agency.gov',
      });
      const dnsResults = [
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domain.names),
          state: 'pending',
        },
      ];

      const error = await DomainService.provision(domain, dnsResults).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(
        // eslint-disable-next-line max-len
        'The Acme Challenge DNS records must be set correctly before the domain can be provisioned.',
      );
    });

    it(`creates the service, sets the domain to \`provisioning\`
        and queues the status check`, async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'createExternalDomain').resolves();
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        names: 'www.agency.gov',
      });
      const dnsResults = [
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domain.names),
          state: 'success',
        },
      ];

      await DomainService.provision(domain, dnsResults);

      await domain.reload();

      sinon.assert.calledOnceWithMatch(
        CloudFoundryAPIClient.prototype.createExternalDomain,
        sinon.match({
          domains: domain.names,
          name: domain.serviceName,
          origin: domain.origin,
          path: domain.path,
          cfCdnSpaceName: config.env.cfCdnSpaceName,
          cfDomainWithCdnPlanGuid: config.env.cfDomainWithCdnPlanGuid,
        }),
      );
      sinon.assert.calledOnceWithExactly(
        DomainQueue.prototype.add,
        'checkProvisionStatus',
        {
          id: domain.id,
        },
      );
      expect(domain.state).to.eq(Domain.States.Provisioning);
    });
  });

  describe('.canMigrate()', () => {
    it('returns true if the domain is provisioned and has a service', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioned,
        serviceName: 'www.agency.gov-ext',
      });

      expect(DomainService.canMigrate(domain)).to.be.true;
    });

    it('returns false if the domain has no service name', () => {
      const domain = DomainFactory.build({
        state: Domain.States.Provisioned,
        serviceName: null,
      });

      expect(DomainService.canMigrate(domain)).to.be.false;
    });

    [
      Domain.States.Pending,
      Domain.States.Provisioning,
      Domain.States.Failed,
      Domain.States.Deprovisioning,
    ].forEach((state) => {
      it(`returns false if the domain is \`${state}\``, () => {
        const domain = DomainFactory.build({
          state,
          serviceName: 'www.agency.gov-ext',
        });

        expect(DomainService.canMigrate(domain)).to.be.false;
      });
    });
  });

  describe('.findMigrationCandidates()', () => {
    it('finds non-preview branch configs on other sites', async () => {
      const oldSite = await SiteFactory();
      const newSite = await SiteFactory({ demoBranch: 'demo' });

      const domain = await DomainFactory.create({
        siteId: oldSite.id,
        state: Domain.States.Provisioned,
      });

      const results = await DomainService.findMigrationCandidates(domain);
      const resultIds = results.map((r) => r.id);
      const expectedIds = newSite.SiteBranchConfigs.map((sbc) => sbc.id);

      expect(resultIds).to.include.members(expectedIds);
      expect(results.some((r) => r.Site.id === oldSite.id)).to.be.false;
      expect(results.every((r) => r.context !== 'preview')).to.be.true;
    });

    it('excludes branch configs that already have another domain', async () => {
      const oldSite = await SiteFactory();
      const newSite = await SiteFactory();
      const domain = await DomainFactory.create({
        siteId: oldSite.id,
        state: Domain.States.Provisioned,
      });
      await DomainFactory.create({
        siteId: newSite.id,
        names: 'www.other.gov',
      });

      const results = await DomainService.findMigrationCandidates(domain);
      const occupiedSbcIds = newSite.SiteBranchConfigs.map((sbc) => sbc.id);

      expect(results.map((r) => r.id)).to.not.include.members(occupiedSbcIds);
    });
  });

  describe('.migrate()', () => {
    async function createMigrationPair({
      names = 'www.agency.gov',
      serviceName = 'www.agency.gov-ext',
      sourceOverrides = {},
      createPendingTarget = false,
    } = {}) {
      const oldSite = await SiteFactory();
      const newSite = await SiteFactory();

      const source = await DomainFactory.create({
        siteId: oldSite.id,
        names,
        serviceName,
        origin: `${oldSite.awsBucketName}.app.cloud.gov`,
        path: '/site/old-owner/old-repo',
        state: Domain.States.Provisioned,
        ...sourceOverrides,
      });

      await source.reload({
        include: [Site, SiteBranchConfig],
      });
      const targetSbc = await SiteBranchConfig.findByPk(newSite.SiteBranchConfigs[0].id, {
        include: [Site],
      });
      const target = createPendingTarget
        ? await DomainFactory.create({
            siteId: newSite.id,
            siteBranchConfigId: targetSbc.id,
            names,
          })
        : null;

      return { source, target, targetSbc, oldSite, newSite };
    }

    it('throws if the domain cannot be migrated', async () => {
      const { source, targetSbc } = await createMigrationPair({
        sourceOverrides: {
          state: Domain.States.Pending,
        },
      });

      const error = await DomainService.migrate(source, targetSbc).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(
        "Only 'provisioned' domains with an external domain service can be migrated.",
      );
    });

    it('throws if no target domain is given', async () => {
      const { source } = await createMigrationPair();

      const error = await DomainService.migrate(source, null).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('A site branch config to migrate to must be provided.');
    });

    it('throws if the target domain is on the same site', async () => {
      const site = await SiteFactory({
        demoBranch: 'demo',
      });
      const source = await DomainFactory.create({
        siteId: site.id,
        names: 'www.agency.gov',
        serviceName: 'www.agency.gov-ext',
        state: Domain.States.Provisioned,
      });
      const demoSbc = site.SiteBranchConfigs.find(
        (sbc) => sbc.context === Domain.Contexts.Demo,
      );
      const targetSbc = await SiteBranchConfig.findByPk(demoSbc.id, { include: [Site] });

      const error = await DomainService.migrate(source, targetSbc).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(
        'Domains can only be migrated to a domain on a different site.',
      );
    });

    it('throws if the destination already has another domain', async () => {
      const { source, targetSbc, newSite } = await createMigrationPair();
      await DomainFactory.create({
        siteId: newSite.id,
        siteBranchConfigId: targetSbc.id,
        names: 'www.other.gov',
      });

      const error = await DomainService.migrate(source, targetSbc).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq(
        'The selected site branch configuration already has a custom domain.',
      );
    });

    it(`clones the domain to the destination, deletes the source domain
        updates the service and queues a destination build`, async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'updateExternalDomain').resolves();
      const rebuildSpy = sinon.stub(DomainService, 'rebuildAssociatedSite').resolves();

      const { source, targetSbc, newSite } = await createMigrationPair();
      const serviceName = source.serviceName;
      const expectedOrigin = siteViewOrigin(newSite);
      const expectedPath = targetSbc.s3Key;

      const result = await DomainService.migrate(source, targetSbc);

      expect(result.source.id).to.eq(source.id);
      expect(result.target.names).to.eq(source.names);
      expect(result.target.state).to.eq(Domain.States.Provisioned);
      expect(result.target.serviceName).to.eq(serviceName);
      expect(result.target.origin).to.eq(expectedOrigin);
      expect(result.target.path).to.eq(expectedPath);

      const deletedSource = await Domain.findByPk(source.id, { paranoid: false });
      expect(deletedSource.deletedAt).to.not.be.null;
      expect(deletedSource.state).to.eq(Domain.States.Pending);
      expect(deletedSource.serviceName).to.be.null;

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.updateExternalDomain,
        {
          name: serviceName,
          origin: expectedOrigin,
          path: expectedPath,
        },
      );
      sinon.assert.calledOnceWithExactly(
        rebuildSpy,
        result.target,
        SourceCodePlatformHelper.flows.FLOW__ADMIN_REBUILD,
      );
    });

    it('rolls the records back if the service update fails', async () => {
      sinon
        .stub(CloudFoundryAPIClient.prototype, 'updateExternalDomain')
        .rejects(new Error('CF is unhappy'));

      const { source, targetSbc } = await createMigrationPair();
      const serviceName = source.serviceName;

      const error = await DomainService.migrate(source, targetSbc).catch((e) => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('CF is unhappy');

      const reloadedSource = await Domain.findByPk(source.id);
      expect(reloadedSource).to.not.be.null;
      expect(reloadedSource.state).to.eq(Domain.States.Provisioned);
      expect(reloadedSource.serviceName).to.eq(serviceName);

      const target = await Domain.findOne({
        where: { siteBranchConfigId: targetSbc.id },
      });
      expect(target).to.be.null;
    });

    it('rolls back and reports a busy CF service without rebuilding', async () => {
      const cfError = new Error('An operation for the service instance is in progress.');
      cfError.errors = [
        {
          code: 60016,
          title: 'CF-AsyncServiceInstanceOperationInProgress',
        },
      ];
      sinon
        .stub(CloudFoundryAPIClient.prototype, 'updateExternalDomain')
        .rejects(cfError);
      const rebuildSpy = sinon.stub(DomainService, 'rebuildAssociatedSite').resolves();
      const { source, targetSbc } = await createMigrationPair();
      const serviceName = source.serviceName;

      const error = await DomainService.migrate(source, targetSbc).catch((e) => e);

      expect(error.status).to.eq(400);
      expect(error.message).to.include('still processing the previous service update');
      expect(error.message).to.include('This migration was not applied');
      const restored = await Domain.findByPk(source.id);
      expect(restored.state).to.eq(Domain.States.Provisioned);
      expect(restored.serviceName).to.eq(serviceName);
      expect(
        await Domain.findOne({
          where: { siteBranchConfigId: targetSbc.id },
        }),
      ).to.be.null;
      sinon.assert.notCalled(rebuildSpy);
      sinon.assert.calledOnce(CloudFoundryAPIClient.prototype.updateExternalDomain);
    });

    it('does not roll back if queuing the destination build fails', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'updateExternalDomain').resolves();
      sinon
        .stub(DomainService, 'rebuildAssociatedSite')
        .rejects(new Error('build queue unavailable'));
      const { source, targetSbc } = await createMigrationPair();
      const serviceName = source.serviceName;

      const error = await DomainService.migrate(source, targetSbc).catch((e) => e);

      expect(error.message).to.eq('build queue unavailable');
      expect(await Domain.findByPk(source.id)).to.be.null;
      const target = await Domain.findOne({
        where: { siteBranchConfigId: targetSbc.id },
      });
      expect(target.state).to.eq(Domain.States.Provisioned);
      expect(target.serviceName).to.eq(serviceName);
    });
  });
});
