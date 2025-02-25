/* eslint-disable sonarjs/x-powered-by */
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const {
  createS3ServiceInstanaces,
  createS3ServiceBindings,
  createS3ServiceBindingDetails,
} = require('./createResponse');

const PORT = 3456;

// Fetch service instanaces
app.get('/v3/service_instances', (_, res) => {
  const response = createS3ServiceInstanaces();

  res.json(response);
});

// Fetch service instanace credentials bindings by name
app.get('/v3/service_credential_bindings', (req, res) => {
  const { query } = req;
  const { service_instance_names } = query;

  const response = createS3ServiceBindings(service_instance_names);

  res.json(response);
});

// Fetch service instanace credentials by binding guid
app.get('/v3/service_credential_bindings/:guid/details', (req, res) => {
  const { params } = req;
  const { guid } = params;

  const response = createS3ServiceBindingDetails(guid);

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
