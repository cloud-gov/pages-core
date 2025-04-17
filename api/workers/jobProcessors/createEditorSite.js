const SiteCreator = require('../../services/SiteCreator');
const Organization = require('../../services/organization');
const { encrypt } = require('../../services/Encryptor');
const { UserEnvironmentVariable } = require('../../models');
const { createJobLogger } = require('./utils');
const { userEnvVar } = require('../../../config');

/**
 * The Site Queue job processor
 * to start a CF Task to build the site's branch
 * @async
 * @method createEditorSite
 * @param {Object} job - The bullmq job object
 * * @param {object} job.data - The job data object
 * * * @param {string} job.data.userEmail - The org user email
 * * * @param {string} job.data.orgName - The org name
 * * * @param {string} job.data.siteId - The editor site id
 * * * @param {string} job.data.siteName - The editor site id
 * * * @param {string} job.data.apiKey - The editor site bot api key
 * @return {Promise<{Object}>} The bullmq's queue add job response
 */
async function createEditorSite(job) {
  const logger = createJobLogger(job);
  const { userEmail, orgName, siteId, apiKey } = job.data;

  logger.log(`Creating new editor site for ${orgName}`);
  try {
    logger.log('Creating user and org');
    const { user, org } = await Organization.setupSiteEditorOrganization(
      userEmail,
      orgName,
    );

    logger.log('Creating site');
    const site = await SiteCreator.createSite({
      user,
      siteParams: {
        owner: 'cloud-gov',
        organizationId: Math.integer(org.id, 10),
        repository: 'pages-site-gantry',
        engine: 'node.js',
      },
    });

    logger.log('Adding env vars to site');
    const apiKeyEnc = encrypt(apiKey, userEnvVar.key);
    await UserEnvironmentVariable.create({
      siteId: site.id,
      name: 'EDITOR_API_KEY',
      ciphertext: apiKeyEnc.ciphertext,
      hint: apiKeyEnc.hint,
    });

    const editorSiteEnc = encrypt(siteId, userEnvVar.key);
    await UserEnvironmentVariable.create({
      siteId: site.id,
      name: 'EDITOR_SITE_NAME',
      ciphertext: editorSiteEnc.ciphertext,
      hint: editorSiteEnc.hint,
    });

    logger.log(`Completed editor site creation for ${orgName}`);

    // ToDo Send POST to Pages Editor with success
    // { site: id, status: success, pagesSiteId }

    return true;
  } catch (err) {
    const message = `Error createing editor site for ${orgName}: ${err?.message}`;
    logger.log(message);

    // ToDo Send POST to Pages Editor with error
    // { site: id, status: error, message: err.message }

    throw new Error(message);
  }
}

module.exports = createEditorSite;
