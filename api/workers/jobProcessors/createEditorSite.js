const axios = require('axios');
const SiteCreator = require('../../services/SiteCreator');
const Organization = require('../../services/organization');
const { encrypt, encryptObjectValues } = require('../../services/Encryptor');
const Mailer = require('../../workers/Mailer');
const { alert } = require('../../services/mailer/templates');
const { UserEnvironmentVariable } = require('../../models');
const { createJobLogger } = require('./utils');
const { userEnvVar, encryption } = require('../../../config');

const { PAGES_EDITOR_HOST } = process.env;

/**
 * The Site Queue job processor
 * to start a CF Task to build the site's branch
 * @async
 * @method createEditorSite
 * @param {Object} job - The bullmq job object
 * * @param {object} job.data - The job data object
 * * * @param {string} job.data.siteId - The editor site id
 * * * @param {string} job.data.siteName - The editor site id
 * * * @param {string} job.data.orgName - The editor org name
 * * * @param {string} job.data.apiKey - The editor site bot api key
 * @return {Promise<{Object}>} The bullmq's queue add job response
 */
async function createEditorSite(job) {
  // Webhook client to send success or error request to
  // Pages Editor site endpoint
  const webhookClient = axios.create({
    baseURL: `${PAGES_EDITOR_HOST}/api/webhook/site`,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const logger = createJobLogger(job);
  const {
    siteId: editorSiteId,
    siteName: editorSiteName,
    orgName: editorOrgName,
    apiKey,
  } = job.data;

  logger.log(`Creating new editor site for ${editorSiteName}`);
  try {
    logger.log('Creating user and org');
    const { user, org } = await Organization.setupSiteEditorOrganization(
      editorSiteName,
      editorOrgName,
    );

    logger.log('Creating site');
    const { site, s3 } = await SiteCreator.createSite({
      user,
      siteParams: {
        owner: 'cloud-gov',
        organizationId: parseInt(org.id, 10),
        repository: 'pages-site-gantry',
        engine: 'node.js',
      },
    });

    logger.log('Adding env vars to site');

    const apiKeyEnc = encrypt(apiKey, userEnvVar.key);
    await UserEnvironmentVariable.create({
      siteId: site.id,
      name: 'PAYLOAD_API_KEY',
      ciphertext: apiKeyEnc.ciphertext,
      hint: apiKeyEnc.hint,
    });

    const editorHostEnc = encrypt(PAGES_EDITOR_HOST, userEnvVar.key);
    await UserEnvironmentVariable.create({
      siteId: site.id,
      name: 'EDITOR_APP_URL',
      ciphertext: editorHostEnc.ciphertext,
      hint: editorHostEnc.hint,
    });

    logger.log(`Completed editor site creation for ${editorSiteName}`);

    logger.log('Posting site creation success webhook');

    const data = encryptObjectValues(
      {
        siteId: site.id,
        orgId: org.id,
        bucket: s3.bucket,
      },
      encryption.key,
    );
    await webhookClient.post(`/${editorSiteId}`, data);

    logger.log('Site successfully created');

    return true;
  } catch (err) {
    const message = `Error creating editor site for ${editorSiteName}: ${err?.message}`;

    logger.log(message);

    const mail = new Mailer();
    const html = alert({ reason: message, errors: [err] });

    try {
      await mail.send({
        html,
        subject: 'Error Creating New Editor Site',
        to: process.env.OPS_EMAIL,
      });
    } catch (error) {
      logger.log(error.message);
      throw new Error(error.message);
    }

    throw new Error(message);
  }
}

module.exports = createEditorSite;
