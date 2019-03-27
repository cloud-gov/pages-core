const request = require('request');
const url = require('url');
const CloudFoundryAuthClient = require('./cfAuthClient');
const config = require('../../config');

class CloudFoundryAPIClient {
  constructor() {
    this.authClient = new CloudFoundryAuthClient();
  }

  createS3ServiceInstance(name, serviceName) {
    return this.fetchS3ServicePlanGUID(serviceName)
      .then((servicePlanGuid) => {
        const body = {
          name,
          service_plan_guid: servicePlanGuid,
          space_guid: this.spaceGUID(),
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


  // TODO Check Permissions to Delete Services

  // deleteS3ServiceInstance(name) {
  //   return this.fetchServiceInstances()
  //     .then(res => this.filterEntity(res, name))
  //     .then(instance => {
  //       return this.accessToken().then(token => this.request(
  //         `DELETE`,
  //         `/v2/service_instances/${instance.metadata.guid}?accepts_incomplete=true`,
  //         token
  //       ));
  //     })
  // }

  // deleteServiceKey(name) {
  //   return this.fetchServiceKeys()
  //     .then(res => this.filterEntity(res, name))
  //     .then(key => key.entity.service_instance_guid)
  //     .then(guid => {
  //       return this.authClient.accessToken().then(token => this.request(
  //         `DELETE`,
  //         `/v2/service_keys/${guid}`
  //       ));
  //     })
  // }

  fetchServiceInstance(name) {
    return this.fetchServiceInstances()
      .then(res => this.filterEntity(res, name));
  }

  fetchServiceInstanceCredentials(name) {
    return this.fetchServiceInstance(name)
      .then(instance => this.accessToken().then(token => this.request(
        'GET',
        `/v2/service_instances/${instance.metadata.guid}/service_keys`,
        token
      )))
      .then(keys => this.firstEntity(keys, `${name} Service Keys`))
      .then(key => key.entity.credentials);
  }

  fetchServiceInstances() {
    return this.accessToken().then(token => this.request(
      'GET',
      '/v2/service_instances',
      token
    ));
  }

  fetchServiceKey(name) {
    return this.fetchServiceKeys()
      .then(res => this.filterEntity(res, name))
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
    )).then(res => this.filterEntity(res, serviceName))
      .then(service => service.metadata.guid);
  }

  // Private methods
  accessToken() {
    return this.authClient.accessToken();
  }

  filterEntity(res, name, field = 'name') {
    const filtered = res.resources.filter(item => item.entity[field] === name);

    if (filtered.length === 1) return filtered[0];
    return Promise.reject(new Error({
      message: 'Not found',
      name,
      field,
    }));
  }

  firstEntity(res, name) {
    if (res.resources.length === 0) {
      return Promise.reject(new Error({
        message: 'Not found',
        name,
      }));
    }

    return res.resources[0];
  }

  parser(res) {
    if (typeof res === 'string') return JSON.parse(res);
    return res;
  }

  resolveAPIURL(path) {
    return url.resolve(
      config.env.cfApiHost,
      path
    );
  }

  request(method, path, accessToken, json) {
    return new Promise((resolve, reject) => {
      request({
        method: method.toUpperCase(),
        url: this.resolveAPIURL(path),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json,
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode > 399) {
          const errorMessage = `Received status code: ${response.statusCode}`;
          reject(new Error(body || errorMessage));
        } else {
          resolve(this.parser(body));
        }
      });
    });
  }

  spaceGUID() {
    return config.env.buildSpaceGuid;
  }
}

module.exports = CloudFoundryAPIClient;
