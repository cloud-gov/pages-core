/* eslint-disable sonarjs/x-powered-by */
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const {
  createS3ServiceInstances,
  createS3ServiceBindings,
  createS3ServiceBindingDetails,
} = require('./createResponse');

const PORT = 3456;

const { MINIO_ROOT_USER, MINIO_ROOT_PASSWORD } = process.env;
const s3ServiceInstancesMap = new Map();

// Fetch service instances
app.post('/v3/service_instances', express.json(), (req, res) => {
  const response = createS3ServiceInstances();

  const newS3ServiceInstance = {
    guid: req.body.name,
    name: req.body.name,
    relationships: {},
  };

  response.resources.push(newS3ServiceInstance);
  s3ServiceInstancesMap.set(req.body.name, newS3ServiceInstance);

  res.json(response);
});

app.get('/v3/service_instances', (_, res) => {
  const response = createS3ServiceInstances();

  response.resources.push(...s3ServiceInstancesMap.values());

  res.json(response);
});

app.get('/v3/service_plans', async (req, res) => {
  const response = createS3ServiceInstances();

  res.json(response);
});

// Fetch service instance credentials bindings by name
app.get('/v3/service_credential_bindings', (req, res) => {
  const { query } = req;
  const { service_instance_names, names } = query;

  const response = createS3ServiceBindings(service_instance_names);

  response.resources.push({
    name: names,
    credentials: {
      access_key_id: MINIO_ROOT_USER,
      secret_access_key: MINIO_ROOT_PASSWORD,
      region: 'us-gov-west-1',
      bucket: `${names}-key`,
    },
  });

  res.json(response);
});

app.post('/v3/service_credential_bindings', (req, res) => {
  const { query } = req;
  const { service_instance_names } = query;

  const response = createS3ServiceBindings(service_instance_names);

  res.json(response);
});

// Fetch service instance credentials by binding guid
app.get('/v3/service_credential_bindings/:guid/details', (req, res) => {
  const { params } = req;
  const { guid } = params;

  let response;

  try {
    response = createS3ServiceBindingDetails(guid);
  } catch {
    response = {
      name: guid,
      credentials: {
        access_key_id: MINIO_ROOT_USER,
        secret_access_key: MINIO_ROOT_PASSWORD,
        region: 'us-gov-west-1',
        bucket: 'cg-123456789',
      },
    };
  }

  res.json(response);
});

// Returns a fake access token for CF API request calls
app.post('/oauth/token', async (_, res) => {
  const token = jwt.sign({ type: 'local' }, 'local', { expiresIn: 3600 });

  res.json({
    data: {
      access_token: token,
    },
  });
});

// Start the server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local dev CF API is running on http://cf-api:${PORT}`);
});
