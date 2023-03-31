const { expect } = require('chai');
const nock = require('nock');
const config = require('../../../../config');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const responses = require('../../support/factory/responses');

describe('CloudFoundryAPIClient', () => {
  afterEach(() => nock.cleanAll());

  describe('.createS3ServiceInstance', () => {
    it('should return a new service plan', (done) => {
      const name = 'my-bucket';
      const planName = 'aws-bucket';
      const planGuid = 'plan-guid';

      const requestBody = { name, service_plan_guid: planGuid };

      const planResponses = {
        resources: [
          responses.service({ guid: planGuid }, { name: planName }),
        ],
      };
      const serviceResponse = responses.service({}, { name });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(planResponses);
      apiNocks.mockCreateS3ServiceInstance(requestBody, serviceResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createS3ServiceInstance(
        name, planName, config.env.cfSpaceGuid, config.env.s3ServicePlanId
      )
        .then((res) => {
          expect(res).to.be.an('object');
          expect(res.entity.name).to.equal(name);
          done();
        });
    });

    it('should return 400 when missing name or service plan name', (done) => {
      const name = undefined;
      const serviceName = 'service-name';

      const requestBody = {};

      const planResponse = {
        resources: [
          responses.service(undefined, { name: serviceName }),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(planResponse);
      apiNocks.mockCreateS3ServiceInstance(requestBody);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createS3ServiceInstance(
        name, serviceName, config.env.cfSpaceGuid, config.env.s3ServicePlanId
      )
        .catch((err) => {
          expect(err).to.be.an('error');
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
        name,
        service_instance_guid: serviceInstanceGuid,
      };

      const response = responses.service({}, {
        name: keyName,
        service_instance_guid: serviceInstanceGuid,
      });

      mockTokenRequest();
      apiNocks.mockCreateServiceKey(requestBody, response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid)
        .then((res) => {
          expect(res).to.deep.equal(response);
          done();
        });
    });

    it('should return a new service key with custom key name', (done) => {
      const name = 'my-service-instance';
      const customKeyName = 'super-key';
      const keyName = `${name}-${customKeyName}`;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {
        name,
        service_instance_guid: serviceInstanceGuid,
      };

      const response = responses.service({}, {
        name: keyName,
        service_instance_guid: serviceInstanceGuid,
      });

      mockTokenRequest();
      apiNocks.mockCreateServiceKey(requestBody, response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid, customKeyName)
        .then((res) => {
          expect(res).to.deep.equal(response);
          done();
        });
    });

    it('should return 400 when missing name or service instance guid', (done) => {
      const name = undefined;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {};

      mockTokenRequest();
      apiNocks.mockCreateServiceKey(requestBody);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('.createSiteBucket', () => {
    it('should create a new S3 service and service key', (done) => {
      const name = 'my-bucket';
      const keyIdentifier = 'key';
      const keyName = `${name}-key`;
      const planName = 'basic-vpc';
      const planGuid = 'plan-guid';
      const bucketGuid = 'bucket-guid';

      const instanceRequestBody = { name, service_plan_guid: planGuid };
      const keyRequestBody = { name, service_instance_guid: bucketGuid };

      const planResponses = {
        resources: [
          responses.service({ guid: planGuid }, { name: planName }),
        ],
      };
      const bucketResponse = responses.service({ guid: bucketGuid }, { name });
      const keyResponse = responses.service({}, {
        name: keyName,
        service_instance_guid: bucketGuid,
      });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(planResponses);
      apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
      apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createSiteBucket(
        name, config.env.cfSpaceGuid, config.app.s3ServicePlanId, keyIdentifier, planName
      )
        .then((res) => {
          expect(res).to.be.an('object');
          expect(res.entity.name).to.equal(keyName);
          expect(res.entity.service_instance_guid).to.equal(bucketGuid);
          done();
        });
    });
  });

  describe('.createRoute', () => {
    it('should create a new route', (done) => {
      const host = 'my-route';
      const guid = '12345';
      const response = responses.service({ guid }, { host });

      mockTokenRequest();
      apiNocks.mockCreateRoute(response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createRoute(host, config.env.cfDomainGuid, config.env.cfSpaceGuid)
        .then((res) => {
          expect(res.metadata.guid).to.equal(guid);
          expect(res.entity.host).to.equal(host);
          done();
        })
        .catch(done);
    });
  });

  describe('.createExternalDomain()', () => {
    it('creates the service', async () => {
      const domains = 'www.agency.gov';
      const name = 'www.agency.gov-ext';
      const origin = 'abc.sites.pages.cloud.gov';
      const path = '/site/owner/repo/';

      mockTokenRequest();
      apiNocks.mockFetchSpacesRequest(config.env.cfCdnSpaceName, { resources: [{ guid: 'guid' }] });
      apiNocks.mockCreateService({
        domains, name, origin, path,
      }, {});

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
