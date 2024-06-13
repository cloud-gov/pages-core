const _ = require('underscore');
const parse = require('json-templates');
const { app: { appEnv }, encryption } = require('../../config');
const CloudFoundryAuthClient = require('./cfAuthClient');
const Encryptor = require('../services/Encryptor');
const HttpClient = require('./httpClient');
const { wait } = require('.');

const TASK_LABEL = 'build-task';

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

  async fetchTaskByGuid(guid) {
    const response = await this.authRequest('GET', `/v3/tasks/${guid}`);

    if (response?.errors) {
      return null;
    }

    return response;
  }

  fetchTaskByName(name) {
    return this.fetchTasks({ names: name })
      .then(tasks => tasks.find(task => task.name === name));
  }

  fetchTasks(params) {
    const qs = objToQueryParams(params);

    return this.authRequest('GET', `/v3/tasks?${qs.toString()}`).then(
      body => body.resources
    );
  }

  /**
  * Polls a CF Task instance for a finished state
  * Defaults to 1 hour of polling in 15 second intervals
  * It cancels the task if it runs passed the number of total attempts
  * @async
  * @method pollTaskStatus
  * @param {string} guid - The cf task guid.
  * @param {Object} options - The options for polling.
  * @param {number} [options.attempt=1] - The starting attempt count.
  * @param {number} [options.totalAttempts=240] - The total number of attempts
  * @param {number} [options.sleepNumber=15000] - The milliseconds
  * to wait before the next attempt
  * @return {Promise<{Object}>} An object with the state value or possible error
  */
  async pollTaskStatus(
    guid,
    { attempt = 1, totalAttempts = 240, sleepInterval = 15000 } = {}
  ) {
    if (attempt > totalAttempts) {
      await this.cancelTask(guid);
      const totalMins = ((sleepInterval / 1000) * totalAttempts) / 60;

      throw new Error(`Task timed out after ${totalMins} minutes`);
    }

    const response = await this.fetchTaskByGuid(guid);

    if (!response) {
      throw new Error('Task not found');
    }

    if (['SUCCEEDED', 'FAILED'].includes(response.state)) {
      return {
        state: response.state,
      };
    }

    const nextAttempt = attempt + 1;
    await wait(sleepInterval);

    return this.pollTaskStatus(guid, {
      attempt: nextAttempt,
      totalAttempts,
      sleepInterval,
    });
  }

  async startBuildTask(
    task,
    job,
    { attempt = 1, totalAttempts = 3, sleepInterval = 1000 } = {}
  ) {
    // construct the task parameter template by filling in values from the BuildTaskType metadata
    // TODO: link to template documentation
    const template = parse(task.BuildTaskType.metadata.template);

    const encryptedTask = Encryptor.encryptObjectValues(task, encryption.key);
    const encryptedJob = Encryptor.encryptObjectValues(job, encryption.key);
    const taskParams = template({ task: encryptedTask, job: encryptedJob });

    const appGUID = await this.fetchTaskAppGUID(
      task.BuildTaskType.metadata.appName
    );

    try {
      return await this.authRequest(
        'POST',
        `/v3/apps/${appGUID}/tasks`,
        taskParams
      );
    } catch (error) {
      if (attempt === totalAttempts) {
        throw error;
      }

      const nextAttempt = attempt + 1;
      const retryOptions = {
        attempt: nextAttempt,
        totalAttempts,
        sleepInterval,
      };
      await wait(sleepInterval);
      return this.startBuildTask(task, job, retryOptions);
    }
  }

  /**
  * Starts a CF Task instance to build a site
  * @async
  * @method startSiteBuildTask
  * @param {Object} message - The job message
  * @param {Array} message.environment - The array of objects of key value command params
  * @param {Array} [message.containerName] - The name of the app task container to build the site
  * Defaults to the pages-build-container-{env} app
  * @param {Array} [message.containerSize] - The container settings for disk and memory
  * defaults to 4GB disk and 2GB of memory
  * @param {number} jobId - The queue job id
  * @return {Promise<{Object}>} An object with the state value or possible error
  */
  async startSiteBuildTask(
    message,
    jobId,
    { attempt = 1, totalAttempts = 3, sleepInterval = 1000 } = {}
  ) {
    const settings = {
      default: {
        disk_in_mb: 4 * 1024,
        memory_in_mb: 2 * 1024,
      },
      large: {
        disk_in_mb: 7 * 1024,
        memory_in_mb: 8 * 1024,
      },
    };

    const containerName = message?.containerName || `pages-build-container-${appEnv}`;
    const containerSize = message?.containerSize || 'default';
    const containerSettings = settings[containerSize];
    const commandParams = message.environment.reduce(
      (acc, current) => ({ ...acc, [current.name]: current.value }),
      {}
    );
    const encryptedParams = Encryptor.encryptObjectValues(
      commandParams,
      encryption.key,
      {
        onlyEncryptKeys: [
          'STATUS_CALLBACK',
          'GITHUB_TOKEN',
          'AWS_ACCESS_KEY_ID',
          'AWS_SECRET_ACCESS_KEY',
          'BUCKET',
        ],
      }
    );
    const command = `cd app && python main.py -p '${JSON.stringify(encryptedParams)}'`;

    if (command.length >= 4097) {
      throw new Error(
        `Command params for site build job ${jobId} are greater than 4096 characters.`
      );
    }

    const taskParams = {
      ...containerSettings,
      name: `build-${jobId}`,
      command,
      metadata: { labels: { type: TASK_LABEL } },
    };
    const appGUID = await this.fetchTaskAppGUID(containerName);

    try {
      return await this.authRequest(
        'POST',
        `/v3/apps/${appGUID}/tasks`,
        taskParams
      );
    } catch (error) {
      if (attempt === totalAttempts) {
        throw error;
      }

      const nextAttempt = attempt + 1;
      const retryOptions = {
        attempt: nextAttempt,
        totalAttempts,
        sleepInterval,
      };
      await wait(sleepInterval);
      return this.startSiteBuildTask(message, jobId, retryOptions);
    }
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

  async retry(
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
      const next = await this[methodName](...methodArgs);
      await wait(retries * sleepInterval);

      return this.retry(methodName, methodArgs, {
        res: next,
        retries: retries + 1,
        totalRetries,
        sleepInterval,
      });
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

module.exports = CloudFoundryAPIClient;
