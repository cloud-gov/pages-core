const _ = require('underscore');
const parse = require('json-templates');

const CloudFoundryAuthClient = require('./cfAuthClient');
const HttpClient = require('./httpClient');

function sleep(ms) {
  return function runSleep(res) {
    return new Promise(resolve => setTimeout(() => resolve(res), ms));
  };
}

function filterEntity(res, name, field = 'name') {
  const errMsg = `Not found: Entity @${field} = ${name}`;
  const filtered = res.resources.filter(item => item[field] === name);
  if (filtered.length === 0) {
    const error = new Error(errMsg);
    error.name = name;
    throw error;
  }
  return filtered;
}

function findEntity(res, name, field = 'name', { errorMessage } = {}) {
  const errMsg = errorMessage || `Not found: Entity @${field} = ${name}`;
  const entity = res.resources.find(item => _.get(item, field) === name);
  if (!entity) {
    const error = new Error(errMsg);
    error.name = name;
    throw error;
  }
  return entity;
}

function firstEntity(res, errorName) {
  if (res.resources.length === 0) {
    const error = new Error('Not found');
    error.name = errorName;
    throw error;
  }

  return res.resources[0];
}

function objToQueryParams(obj) {
  const qs = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    qs.append(key, value);
  });
  return qs;
}

function buildRequestBody({
  type = 'managed',
  name,
  spaceGuid,
  servicePlanGuid,
  serviceInstanceGuid,
  parameters,
  ...props
}) {
  const createRelationship = (key, value) => ({
    [key]: { data: { guid: value } },
  });

  return {
    type,
    name,
    ...((serviceInstanceGuid || spaceGuid || servicePlanGuid) && {
      relationships: {
        ...(serviceInstanceGuid
          && createRelationship('service_instance', serviceInstanceGuid)),
        ...(spaceGuid && createRelationship('space', spaceGuid)),
        ...(servicePlanGuid
          && createRelationship('service_plan', servicePlanGuid)),
      },
    }),
    ...(parameters && { parameters }),
    ...(props && { ...props }),
  };
}

class CloudFoundryAPIClient {
  constructor({ apiUrl, authClient } = {}) {
    this.authClient = authClient ?? new CloudFoundryAuthClient();
    this.httpClient = new HttpClient(
      apiUrl ?? process.env.CLOUD_FOUNDRY_API_HOST
    );
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
    return this.fetchTasks({ names: name }).then(tasks => tasks.find(task => task.name === name));
  }

  fetchTasks(params) {
    const qs = objToQueryParams(params);

    return this.authRequest('GET', `/v3/tasks?${qs.toString()}`).then(
      body => body.resources
    );
  }

  async startBuildTask(task, job) {
    // construct the task parameter template by filling in values from the BuildTaskType metadata
    // TODO: link to template documentation
    const template = parse(task.BuildTaskType.metadata.template);

    const taskParams = template({ task, job });

    const appGUID = await this.fetchTaskAppGUID(task.BuildTaskType.metadata.appName);
    return this.authRequest('POST', `/v3/apps/${appGUID}/tasks`, taskParams);
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
      cfDomainWithCdnPlanGuid: servicePlanGuid,
    } = params;

    const spaceGuid = await this.authRequest(
      'GET',
      `/v3/spaces?names=${cfCdnSpaceName}`
    ).then(res => res.resources[0].guid);

    const body = buildRequestBody({
      spaceGuid,
      servicePlanGuid,
      name,
      parameters: { domains, origin, path },
    });

    return this.authRequest('POST', '/v3/service_instances', body);
  }

  createS3ServiceInstance(name, serviceName, spaceGuid) {
    return this.fetchS3ServicePlanGUID(serviceName).then((servicePlanGuid) => {
      const body = buildRequestBody({
        name,
        servicePlanGuid,
        spaceGuid,
      });

      return this.accessToken().then(token => this.request('POST', '/v3/service_instances', token, body));
    });
  }

  createServiceKey(
    serviceInstanceName,
    serviceInstanceGuid,
    keyIdentifier = 'key'
  ) {
    const body = buildRequestBody({
      type: 'key',
      name: `${serviceInstanceName}-${keyIdentifier}`,
      serviceInstanceGuid,
    });

    return this.accessToken().then(token => this.request('POST', '/v3/service_credential_bindings', token, body));
  }

  createSiteBucket(
    name,
    spaceGuid,
    keyIdentifier = 'key',
    serviceName = 'basic-vpc'
  ) {
    return this.createS3ServiceInstance(name, serviceName, spaceGuid)
      .then(() => this.retry('fetchServiceInstance', name))
      .then(res => this.createServiceKey(name, res.guid, keyIdentifier))
      .then(() => this.retry(
        'fetchCredentialBindingsInstance',
        `${name}-${keyIdentifier}`
      ));
  }

  deleteRoute(host) {
    return this.accessToken()
      .then(token => this.request('GET', `/v3/routes?hosts=${host}`, token))
      .then(res => findEntity(res, host, 'host'))
      .then(entity => this.accessToken().then(token => this.request('DELETE', `/v3/routes/${entity.guid}`, token)));
  }

  deleteServiceInstance(name) {
    return this.fetchServiceInstance(name)
      .then(instance => this.accessToken()
        .then(token => this.request(
          'DELETE',
          `/v3/service_instances/${instance.guid}`,
          token
        )
          .then(() => ({
            guid: instance.guid,
          }))));
  }

  fetchServiceInstance(name) {
    return this.fetchServiceInstances(name).then(res => findEntity(res, name));
  }

  fetchCredentialBindingsInstance(name) {
    const endpoint = `/v3/service_credential_bindings?names=${name}`;

    return this.accessToken()
      .then(token => this.request('GET', endpoint, token))
      .then(res => findEntity(res, name));
  }

  deleteServiceInstanceCredentials(guid) {
    const endpoint = `/v3/service_credential_bindings/${guid}`;

    return this.accessToken()
      .then(token => this.request('DELETE', endpoint, token));
  }

  fetchServiceInstanceCredentials(name) {
    return this.accessToken()
      .then(token => this.request(
        'GET',
        `/v3/service_credential_bindings?service_instance_names=${name}`,
        token
      ))
      .then(resources => firstEntity(resources, `${name} Service Keys`))
      .then(({ guid }) => this.accessToken().then(token => this.request(
        'GET',
        `/v3/service_credential_bindings/${guid}/details`,
        token
      )))
      .then(resource => resource.credentials);
  }

  fetchServiceInstances(name = null) {
    const query = name ? `?names=${name}` : '';
    const path = `/v3/service_instances${query}`;

    return this.accessToken().then(token => this.request('GET', path, token));
  }

  fetchS3ServicePlanGUID(serviceName) {
    return this.accessToken()
      .then(token => this.request('GET', `/v3/service_plans?names=${serviceName}`, token))
      .then(res => firstEntity(res, `Not found: @${serviceName} service plan.`))
      .then(service => service.guid);
  }

  async fetchTaskAppGUID(appName) {
    return this.accessToken().then(token => this.request(
      'GET',
      `/v3/apps/?names=${appName}`,
      token
    )).then(res => firstEntity(res))
      .then(app => app.guid);
  }

  // Private methods
  accessToken() {
    return this.authClient.accessToken();
  }

  retry(
    methodName,
    args,
    {
      res, retries = 0, totalRetries = 20, sleepInterval = 1000,
    } = {}
  ) {
    const methodArgs = typeof args === 'string' ? [args] : args;

    if (retries >= totalRetries) {
      return res;
    }

    if (
      !res
      || ['initial', 'in progress'].includes(res?.last_operation?.state)
    ) {
      return this[methodName](...methodArgs)
        .then(sleep(retries * sleepInterval))
        .then(next => this.retry(methodName, methodArgs, {
          res: next,
          retries: retries + 1,
          totalRetries,
          sleepInterval,
        }));
    }

    return res;
  }

  request(method, path, accessToken, json) {
    return this.httpClient
      .request({
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

CloudFoundryAPIClient.filterEntity = filterEntity;
CloudFoundryAPIClient.findEntity = findEntity;
CloudFoundryAPIClient.firstEntity = firstEntity;
CloudFoundryAPIClient.objToQueryParams = objToQueryParams;
CloudFoundryAPIClient.buildRequestBody = buildRequestBody;
CloudFoundryAPIClient.sleep = sleep;

module.exports = CloudFoundryAPIClient;
