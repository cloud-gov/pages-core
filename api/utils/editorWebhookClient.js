const axios = require('axios');
const { encryption } = require('../../config');
const { encryptObjectValues } = require('../services/Encryptor');

const { PAGES_PUBLISHER_HOST } = process.env;

const webhookClient = axios.create({
  baseURL: `${PAGES_PUBLISHER_HOST}/api/webhook`,
  headers: {
    'Content-Type': 'application/json',
  },
});

function encryptData(data) {
  return encryptObjectValues(data, encryption.key);
}

const post = async (endpoint, data) => {
  const encryptedData = encryptData(data);
  await webhookClient.post(endpoint, encryptedData);
};

module.exports = {
  post,
};
