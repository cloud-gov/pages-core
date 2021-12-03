const { expect } = require('chai');
const sinon = require('sinon');

const { Domain } = require('../../../../api/models');
const { domain: DomainFactory } = require('../../support/factory');
const DnsService = require('../../../../api/services/Dns');
const DomainService = require('../../../../api/services/Domain');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const { DomainQueue } = require('../../../../api/queues');

describe('Domain Service', () => {
  before(DomainFactory.truncate);
  afterEach(() => {
    sinon.restore();
    return DomainFactory.truncate();
  });

  describe('.buildDnsRecords()', () => {
    it('returns an array of dns records from domain.names', () => {
      const domainNames = ['agency.gov', 'www.agency.gov'];

      const domain = DomainFactory.build({ names: domainNames.join(',') });

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
      const domain = DomainFactory.build({ state: Domain.States.Provisioned });
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

  describe('.checkDeprovisionStatus()', () => {
    it('does nothing if the domain is not deprovisioning', async () => {
      sinon.spy(CloudFoundryAPIClient.prototype, 'fetchServiceInstances');
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create();

      await DomainService.checkDeprovisionStatus(domain.id);

      sinon.assert.notCalled(CloudFoundryAPIClient.prototype.fetchServiceInstances);
      sinon.assert.notCalled(DomainQueue.prototype.add);
    });

    it('updates the state to pending and clears values if the service no longer exists', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstances')
        .resolves({ resources: [] });
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({
        origin: 'foo.sites.pages.cloud.gov',
        path: '/some/site/path',
        serviceName: 'www.agency.gov-ext',
        state: Domain.States.Deprovisioning,
      });

      await DomainService.checkDeprovisionStatus(domain.id);

      await domain.reload();

      expect(domain.state).to.eq(Domain.States.Pending);
      expect(domain.origin).to.be.null;
      expect(domain.path).to.be.null;
      expect(domain.serviceName).to.be.null;
      sinon.assert.notCalled(DomainQueue.prototype.add);
    });

    it('requeues the job if the service still exists', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstances')
        .resolves({ resources: [{}] });
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({ state: Domain.States.Deprovisioning });

      await DomainService.checkDeprovisionStatus(domain.id);

      await domain.reload();

      expect(domain.state).to.eq(Domain.States.Deprovisioning);
      sinon.assert.calledOnceWithExactly(DomainQueue.prototype.add, 'checkDeprovisionStatus', { id: domain.id });
    });
  });

  describe('.checkAcmeChallengeDnsRecord', () => {
    it('checks the Acme Challenge Dns record for each domain name', async () => {
      sinon.stub(DnsService, 'checkAcmeChallengeDnsRecord')
        .resolves();

      const domainNames = ['agency.gov', 'www.agency.gov'];
      const domain = await DomainFactory.create({ names: domainNames.join(',') });

      await DomainService.checkAcmeChallengeDnsRecord(domain);

      sinon.assert.calledTwice(DnsService.checkAcmeChallengeDnsRecord);
      domainNames.forEach((domainName) => {
        sinon.assert.calledWithExactly(DnsService.checkAcmeChallengeDnsRecord, domainName);
      });
    });
  });

  describe('.checkDnsRecords()', () => {
    it('checks the Dns records for each domain names', async () => {
      sinon.stub(DnsService, 'checkDnsRecords')
        .resolves();

      const domainNames = ['agency.gov', 'www.agency.gov'];
      const domain = await DomainFactory.create({ names: domainNames.join(',') });

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

      const domain = await DomainFactory.create({ state: Domain.States.Failed });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload();

      sinon.assert.notCalled(CloudFoundryAPIClient.prototype.fetchServiceInstance);
      sinon.assert.notCalled(DomainQueue.prototype.add);
      expect(domain.state).to.eq(Domain.States.Failed);
    });

    it('sets the domain state to `provisioned` if successful', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .resolves({ entity: { last_operation: { state: 'succeeded' } } });
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({ state: Domain.States.Provisioning });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName
      );
      sinon.assert.notCalled(DomainQueue.prototype.add);
      expect(domain.state).to.eq(Domain.States.Provisioned);
    });

    it('sets the domain state to `failed` if failed', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .resolves({ entity: { last_operation: { state: 'failed' } } });
      sinon.spy(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({ state: Domain.States.Provisioning });

      const error = await DomainService.checkProvisionStatus(domain.id).catch(e => e);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName
      );
      sinon.assert.notCalled(DomainQueue.prototype.add);
      expect(domain.state).to.eq(Domain.States.Failed);
      expect(error).to.be.an('Error');
    });

    it('requeues the status check otherwise', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .resolves(
          { entity: { last_operation: { state: 'something else' } } }
        );
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({ state: Domain.States.Provisioning });

      await DomainService.checkProvisionStatus(domain.id);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.fetchServiceInstance,
        domain.serviceName
      );
      sinon.assert.calledOnceWithExactly(DomainQueue.prototype.add, 'checkProvisionStatus', { id: domain.id });
      expect(domain.state).to.eq(Domain.States.Provisioning);
    });
  });

  describe('.deprovision()', () => {
    it('throws if the domain cannot be deprovisioned', async () => {
      const domain = DomainFactory.build();

      const error = await DomainService.deprovision(domain).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('Only \'provisioning\', \'provisioned\', or \'failed\' domains can be deprovisioned.');
    });

    it('deletes the service instance, sets the domain to `deprovisioning` and queues the status check', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'deleteServiceInstance')
        .resolves();
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({ state: Domain.States.Provisioning });

      await DomainService.deprovision(domain);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.deleteServiceInstance,
        domain.serviceName
      );
      sinon.assert.calledOnceWithExactly(
        DomainQueue.prototype.add,
        'checkDeprovisionStatus',
        { id: domain.id }
      );
      expect(domain.state).to.eq(Domain.States.Deprovisioning);
    });
  });

  describe('.destroy()', () => {
    it('throws an error and does not destroy the domain if the domain is not `pending`', async () => {
      const domain = await DomainFactory.create({ state: Domain.States.Provisioning });

      const error = await DomainService.destroy(domain).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('Only \'pending\' domains can be destroyed.');
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
      const domain = DomainFactory.build({ state: Domain.States.Provisioned });
      const dnsResults = [];

      const error = await DomainService.provision(domain, dnsResults).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('Only \'pending\' domains can be provisioned.');
    });

    it('throws if the dns records do not include an Acme Challenge record', async () => {
      const domain = DomainFactory.build();
      const dnsResults = [];

      const error = await DomainService.provision(domain, dnsResults).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('There must be at least one Acme Challenge DNS record provided');
    });

    it('throws if the dns records are not set', async () => {
      const domain = DomainFactory.build({ names: 'www.agency.gov' });
      const dnsResults = [
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domain.names),
          state: 'pending',
        },
      ];

      const error = await DomainService.provision(domain, dnsResults).catch(e => e);

      expect(error).to.be.an('Error');
      expect(error.message).to.eq('The Acme Challenge DNS records must be set correctly before the domain can be provisioned.');
    });

    it('creates the service, sets the domain to `provisioning` and queues the status check', async () => {
      sinon.stub(CloudFoundryAPIClient.prototype, 'createExternalDomain')
        .resolves();
      sinon.stub(DomainQueue.prototype, 'add');

      const domain = await DomainFactory.create({ names: 'www.agency.gov' });
      const dnsResults = [
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domain.names),
          state: 'success',
        },
      ];

      await DomainService.provision(domain, dnsResults);

      await domain.reload();

      sinon.assert.calledOnceWithExactly(
        CloudFoundryAPIClient.prototype.createExternalDomain,
        domain.names,
        domain.serviceName,
        domain.origin,
        domain.path
      );
      sinon.assert.calledOnceWithExactly(DomainQueue.prototype.add, 'checkProvisionStatus', { id: domain.id });
      expect(domain.state).to.eq(Domain.States.Provisioning);
    });
  });
});
