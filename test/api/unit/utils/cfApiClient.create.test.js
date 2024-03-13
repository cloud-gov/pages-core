const crypto = require('node:crypto');
const { expect } = require('chai');
const nock = require('nock');
const config = require('../../../../config');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');

describe('CloudFoundryAPIClient', () => {
  afterEach(() => nock.cleanAll());

  describe('.createS3ServiceInstance', () => {
    it('should return a new service plan', (done) => {
      const name = 'my-bucket';
      const planName = 'basic-vpc';
      const planGuid = crypto.randomUUID();

      const requestBody = { name, service_plan_guid: planGuid };

      const planResource = factory.createCFAPIResource({
        guid: planGuid,
        name: planName,
      });
      const listPlans = factory.createCFAPIResourceList({
        resources: [planResource],
      });
      const serviceResource = factory.createCFAPIResource({ guid: 1234, name });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(listPlans, planName);
      apiNocks.mockCreateS3ServiceInstance(requestBody, serviceResource);

      const apiClient = new CloudFoundryAPIClient();
      apiClient
        .createS3ServiceInstance(
          name,
          planName,
          config.env.cfSpaceGuid,
          config.env.s3ServicePlanId
        )
        .then((res) => {
          expect(res).to.be.an('object');
          expect(res.name).to.equal(name);
          done();
        });
    });
  });

  describe('.createServiceKey', () => {
    it('should return a new service key', (done) => {
      const name = 'my-service-instance';
      const keyName = `${name}-key`;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {
        type: 'key',
        name: keyName,
        serviceInstanceGuid: serviceInstanceGuid,
      };

      mockTokenRequest();
      apiNocks.mockCreateServiceKeyPost(requestBody);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid).then((res) => {
        expect(res).to.equal('');
        done();
      });
    });

    it('should return a new service key with custom key name', (done) => {
      const name = 'my-service-instance';
      const customKeyIdentifier = 'nocap';
      const keyName = `${name}-${customKeyIdentifier}`;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {
        type: 'key',
        name: keyName,
        serviceInstanceGuid: serviceInstanceGuid,
      };

      mockTokenRequest();
      apiNocks.mockCreateServiceKeyPost(requestBody);(requestBody);

      const apiClient = new CloudFoundryAPIClient();
      apiClient
        .createServiceKey(name, serviceInstanceGuid, customKeyIdentifier)
        .then((res) => {
          expect(res).to.deep.equal('');
          done();
        });
    });
  });

  describe('.createSiteBucket', () => {
    it('should create a new S3 service and service key', (done) => {
      const name = 'my-bucket';
      const planName = 'basic-vpc';
      const planGuid = crypto.randomUUID();
      const keyName = `${name}-key`;
      const serviceInstanceGuid = 'service-instance-guid';
      const requestBody = { name, service_plan_guid: planGuid };
      const planResource = factory.createCFAPIResource({
        guid: planGuid,
        name: planName,
      });
      const listPlans = factory.createCFAPIResourceList({
        resources: [planResource],
      });
      const serviceResource = factory.createCFAPIResource({
        guid: serviceInstanceGuid,
        name,
      });
      const serviceInstanceResources = factory.createCFAPIResourceList({
        resources: [serviceResource],
      });

      const keyRequestBody = {
        type: 'key',
        name: keyName,
        serviceInstanceGuid: serviceInstanceGuid,
      };
      const keyCreateResponse = factory.createCFAPIResource({
        name: keyName,
        serviceInstanceGuid: serviceInstanceGuid,
      });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(listPlans, planName);
      apiNocks.mockCreateS3ServiceInstance(requestBody, serviceResource);
      apiNocks.mockFetchServiceInstancesRequest(serviceInstanceResources, name);
      apiNocks.mockCreateServiceKey(keyRequestBody, keyCreateResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient
        .createSiteBucket(
          name,
          config.env.cfSpaceGuid,
          'key',
          planName
        )
        .then((res) => {
          expect(res).to.be.an('object');
          expect(res.name).to.equal(keyName);
          expect(res.relationships.service_instance.data.guid).to.equal(
            serviceResource.guid
          );
          done();
        });
    });
  });

  describe('.createExternalDomain()', () => {
    it('creates the service', async () => {
      const domains = 'www.agency.gov';
      const name = 'www.agency.gov-ext';
      const origin = 'abc.sites.pages.cloud.gov';
      const path = '/site/owner/repo/';

      mockTokenRequest();
      apiNocks.mockFetchSpacesRequest(config.env.cfCdnSpaceName, {
        resources: [{ guid: 'guid' }],
      });
      apiNocks.mockCreateService(
        {
          domains,
          name,
          origin,
          path,
        },
        {}
      );

      const apiClient = new CloudFoundryAPIClient();
      await apiClient.createExternalDomain({
        domains,
        name,
        origin,
        path,
        cfCdnSpaceName: config.env.cfCdnSpaceName,
        cfDomainWithCdnPlanGuid: config.env.cfDomainWithCdnPlanGuid,
      });
    });
  });
});
