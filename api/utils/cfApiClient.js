const request = require('request');
const url = require('url');
const config = require('../../config');
const CloudFoundryAuthClient = require('./cfAuthClient');
const { filterEntity, firstEntity, objToQueryParams } = require('.');

class CloudFoundryAPIClient {
  constructor() {
    this.authClient = new CloudFoundryAuthClient();
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

  createRoute(name) {
    const body = {
      domain_guid: config.env.cfDomainGuid,
      space_guid: config.env.cfSpaceGuid,
      host: name,
    };

    return this.accessToken().then(token => this.request(
      'POST',
      '/v2/routes',
      token,
      body
    ));
  }

  createS3ServiceInstance(name, serviceName) {
    return this.fetchS3ServicePlanGUID(serviceName)
      .then((servicePlanGuid) => {
        const body = {
          name,
          service_plan_guid: servicePlanGuid,
          space_guid: config.env.cfSpaceGuid,
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

  createSiteBucket(name, keyIdentifier = 'key', serviceName = 'basic-public') {
    return this.createS3ServiceInstance(name, serviceName)
      .then(res => this.createServiceKey(name, res.metadata.guid, keyIdentifier));
  }

  createSiteProxyRoute(bucketName) {
    return this.createRoute(bucketName)
      .then(route => this.mapRoute(route.metadata.guid));
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

  mapRoute(routeGuid) {
    const body = {
      app_guid: config.env.cfProxyGuid,
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

  parser(body, resolver) {
    try {
      const parsed = JSON.parse(body);
      resolver(parsed);
    } catch (e) {
      resolver(body);
    }
  }

  request(method, path, accessToken, json) {
    return new Promise((resolve, reject) => {
      request({
        method: method.toUpperCase(),
        url: url.resolve(
          config.env.cfApiHost,
          path
        ),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode > 399) {
          const errorMessage = `Received status code: ${response.statusCode}`;
          reject(new Error(JSON.stringify(body) || errorMessage));
        } else {
          this.parser(body, resolve);
        }
      });
    });
  }

  authRequest(method, path, json) {
    return this.accessToken().then(token => this.request(method, path, token, json));
  }
}

module.exports = CloudFoundryAPIClient;
