const CloudFoundryAuthClient = require('./cfAuthClient');
const HttpClient = require('./httpClient');
const { filterEntity, firstEntity, objToQueryParams } = require('.');

class CloudFoundryAPIClient {
  constructor({ apiUrl, authClient } = {}) {
    this.authClient = authClient ?? new CloudFoundryAuthClient();
    this.httpClient = new HttpClient(apiUrl ?? process.env.CLOUD_FOUNDRY_API_HOST);
  }

  cancelTask(taskGuid) {
    return this.authRequest('POST', `/v3/tasks/${taskGuid}/actions/cancel`);
  }

  async cancelBuildTask(buildId) {
    const buildTask = await this.fetchBuildTask(buildId);
    if (!buildTask) {
      throw new Error(`There are no tasks for build id: ${buildId}`);
    }
    return this.cancelTask(buildTask.guid);
  }

  fetchBuildTask(buildId) {
    return this.fetchTaskByName(`build-${buildId}`);
  }

  fetchTaskByName(name) {
    return this.fetchTasks({ names: name })
      .then(tasks => tasks.find(task => task.name === name));
  }

  fetchTasks(params) {
    const qs = objToQueryParams(params);

    return this.authRequest('GET', `/v3/tasks?${qs.toString()}`)
      .then(body => body.resources);
  }

  /**
   * @param {Object} params
   * @param {string} params.domains Comma-delimited list of domains
   * @param {string} params.name The CF service name
   * @param {string} params.origin The target origin of the domains
   * @param {string} params.path The target path of the domains
   * @param {string} params.cfCdnSpaceName The name of the cf space to put the domain
   * @param {string} params.cfDomainWithCdnPlanGuid The guuid of the external domain service plan
   * @returns
   */
  async createExternalDomain(params) {
    const {
      domains,
      name,
      origin,
      path,
      cfCdnSpaceName,
      cfDomainWithCdnPlanGuid,
    } = params;

    const spaceGuid = await this.authRequest('GET', `/v3/spaces?names=${cfCdnSpaceName}`)
      .then(res => res.resources[0].guid);

    const body = {
      type: 'managed',
      name,
      relationships: {
        space: {
          data: {
            guid: spaceGuid,
          },
        },
        service_plan: {
          data: {
            guid: cfDomainWithCdnPlanGuid,
          },
        },
      },
      parameters: {
        domains,
        origin,
        path,
      },
    };

    return this.authRequest('POST', '/v3/service_instances', body);
  }

  createRoute(name, domainGuid, spaceGuid) {
    const body = {
      domain_guid: domainGuid,
      space_guid: spaceGuid,
      host: name,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/routes',
      token,
      body
    ));
  }

  createS3ServiceInstance(name, serviceName, spaceGuid) {
    return this.fetchS3ServicePlanGUID(serviceName)
      .then((servicePlanGuid) => {
        const body = {
          name,
          service_plan_guid: servicePlanGuid,
          space_guid: spaceGuid,
        };

        return this.accessToken().then(token => this.request(
          'POST',
          '/v2/service_instances?accepts_incomplete=true',
          token,
          body
        ));
      });
  }

  createServiceKey(serviceInstanceName, serviceInstanceGuid, keyIdentifier = 'key') {
    const body = {
      name: `${serviceInstanceName}-${keyIdentifier}`,
      service_instance_guid: serviceInstanceGuid,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/service_keys',
      token,
      body
    ));
  }

  createSiteBucket(name, spaceGuid, keyIdentifier = 'key', serviceName = 'basic-public') {
    return this.createS3ServiceInstance(name, serviceName, spaceGuid)
      .then(res => this.createServiceKey(name, res.metadata.guid, keyIdentifier));
  }

  createSiteProxyRoute(bucketName, domainGuid, spaceGuid, appGuid) {
    return this.createRoute(bucketName, domainGuid, spaceGuid)
      .then(route => this.mapRoute(route.metadata.guid, appGuid));
  }

  deleteRoute(host) {
    return this.accessToken()
      .then(token => this.request(
        'GET',
        `/v2/routes?q=host:${host}`,
        token
      ))
      .then(res => filterEntity(res, host, 'host'))
      .then(entity => this.accessToken()
        .then(token => this.request(
          'DELETE',
          `/v2/routes/${entity.metadata.guid}?recursive=true&async=true`,
          token
        )));
  }

  deleteServiceInstance(name) {
    return this.fetchServiceInstance(name)
      .then(instance => this.accessToken().then(token => this.request(
        'DELETE',
        `/v2/service_instances/${instance.metadata.guid}?accepts_incomplete=true&recursive=true&async=true`,
        token
      ).then(() => ({
        metadata: {
          guid: instance.metadata.guid,
        },
      }))));
  }

  fetchServiceInstance(name) {
    return this.fetchServiceInstances(name)
      .then(res => filterEntity(res, name));
  }

  fetchServiceInstanceCredentials(name) {
    return this.fetchServiceInstance(name)
      .then(instance => this.accessToken().then(token => this.request(
        'GET',
        `/v2/service_instances/${instance.metadata.guid}/service_keys`,
        token
      )))
      .then(keys => firstEntity(keys, `${name} Service Keys`))
      .then(key => key.entity.credentials);
  }

  fetchServiceInstances(name = null) {
    const path = `/v2/service_instances${name ? `?q=name:${name}` : ''}`;

    return this.accessToken().then(token => this.request(
      'GET',
      path,
      token
    ));
  }

  fetchServiceKey(name) {
    return this.fetchServiceKeys()
      .then(res => filterEntity(res, name))
      .then(key => this.accessToken().then(token => this.request(
        'GET',
        `/v2/service_keys/${key.metadata.guid}`,
        token
      )));
  }

  fetchServiceKeys() {
    return this.accessToken().then(token => this.request(
      'GET',
      '/v2/service_keys',
      token
    ));
  }

  fetchS3ServicePlanGUID(serviceName) {
    return this.accessToken().then(token => this.request(
      'GET',
      '/v2/service_plans',
      token
    )).then(res => filterEntity(res, serviceName))
      .then(service => service.metadata.guid);
  }

  mapRoute(routeGuid, appGuid) {
    const body = {
      app_guid: appGuid,
      route_guid: routeGuid,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/route_mappings',
      token,
      body
    ));
  }

  // Private methods
  accessToken() {
    return this.authClient.accessToken();
  }

  request(method, path, accessToken, json) {
    return this.httpClient.request({
      method,
      url: path,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: json,
    })
      .then(response => response.data);
  }

  authRequest(method, path, json) {
    return this.accessToken().then(token => this.request(method, path, token, json));
  }
}

module.exports = CloudFoundryAPIClient;
