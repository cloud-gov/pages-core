const moment = require('moment');
const PromisePool = require('@supercharge/promise-pool');
const {
  BuildTasksQueue,
  CreateEditorSiteQueue,
  MailQueue,
  SiteBuildsQueue,
} = require('../queues');
const Templates = require('../services/mailer/templates');
const { truncateString } = require('../utils');
const {
  app: { hostname, appEnv, appName },
} = require('../../config');

class QueueJobs {
  constructor(connection) {
    this.siteBuildsQueue = new SiteBuildsQueue(connection);
    this.buildTasksQueue = new BuildTasksQueue(connection);
    this.createEditorSiteQueue = new CreateEditorSiteQueue(connection);
    this.mailQueue = new MailQueue(connection);
  }

  /**
   * Adds a send alert email job to the Mailer Queue
   * to org users about their sandbox sites being removed
   * @async
   * @method sendAlert
   * @param {string} reason - The reason for the alert
   * @param {string} errors: The errors associated to the alert,
   * @return {Promise<{Object}>} The bullmq's queue add job response
   */
  async sendAlert(reason, errors) {
    await this.mailQueue.waitUntilReady();

    return this.mailQueue.add('alert', {
      to: ['federalist-alerts@gsa.gov'],
      subject: `${appName} ${appEnv} Alert | ${reason}`,
      html: Templates.alert({ errors, reason }),
    });
  }

  /**
   * Adds a send Sandbox Reminder email job to the Mailer Queue
   * to org users about their sandbox sites being removed
   * @async
   * @method sendSandboxReminder
   * @param {Object} organization - The organization
   * @param {string} organization.id: organizationId,
   * @param {string} organization.name: organizationName,
   * @param {Object[]} organization.Sites: Array of org sites
   * @param {Object[]} organization.Users: Array of org users
   * @return {Promise<{Object}>} The bullmq's queue add job response
   */
  async sendSandboxReminder(organization) {
    const {
      id: organizationId,
      name: organizationName,
      Sites: sites,
      Users: users,
    } = organization;

    const dateStr = moment(organization.sandboxNextCleaningAt).format('MMMM DD, YYYY');
    // eslint-disable-next-line max-len
    const subject = `Your Pages sandbox organization's sites will be removed in ${organization.daysUntilSandboxCleaning} days`;

    await this.mailQueue.waitUntilReady();

    const { results, errors } = await PromisePool.for(users).process((user) => {
      if (!user.UAAIdentity?.email) {
        throw new Error('User lacks UAA email');
      }
      return this.mailQueue.add('sandbox-reminder', {
        to: [user.UAAIdentity.email],
        subject,
        html: Templates.sandboxReminder({
          organizationName,
          dateStr,
          organizationId,
          sites: sites.map(({ id, owner, repository }) => ({
            id,
            owner,
            repository,
          })),
          hostname,
        }),
      });
    });

    if (errors.length) {
      const errMsg = [
        // eslint-disable-next-line max-len
        `Failed to queue ${errors.length === 1 ? 'a sandbox reminder' : 'sandbox reminders'} ` +
          `for organization@id=${organizationId} members:\n`,
        errors.map((e) => `  user@id=${e.item.id}: ${e.message}`).join('\n'),
      ].join();
      throw new Error(errMsg);
    }

    return results;
  }

  /**
   * Adds a send UAA Invite job to the Mailer Queue
   * @async
   * @method sendUAAInvite
   * @param {string} email - The email to send the invite to
   * @param {string} link - The invite link
   * @param {string} origin - The UAA origin of the email
   * @param {string} orgName - The organization name the email is being invited to
   * @return {Promise<{Object}>} The bullmq's queue add job response
   */
  async sendUAAInvite(email, link, origin, orgName) {
    await this.mailQueue.waitUntilReady();

    if (origin === 'cloud.gov' || origin === 'uaa') {
      return this.mailQueue.add('uaa-invite', {
        to: [email],
        subject: 'Invitation to join cloud.gov Pages',
        html: Templates.uaaInvite({ link }),
      });
    }

    return this.mailQueue.add('uaa-invite', {
      to: [email],
      subject: 'Invitation to join cloud.gov Pages',
      html: Templates.uaaIDPInvite({
        link: hostname,
        orgName,
      }),
    });
  }

  /**
   * Adds a site build task job to the Build Tasks Queue
   * The build's branch, site owner, and site repository attributes
   * are used to creat the name of the job added to the queue
   * @async
   * @method startBuildTask
   * @param {Object} buildTask - An instance of the model Build Taks
   * @param {number} build.id - The build task primary key
   * @param {Object} build.BuildTaskType - The instance's related build task type instance
   * @param {string} build.BuildTaskType.name - The build task type instance name
   * @return {Promise<{Object}>} The bullmq's queue add job response
   */
  async startBuildTask(buildTask, priority) {
    const {
      id: buildTaskId,
      BuildTaskType: { name },
    } = buildTask;

    await this.buildTasksQueue.waitUntilReady();

    return this.buildTasksQueue.add(name, { buildTaskId }, { priority });
  }

  /**
   * Adds a create editor site task job to the Create Editor Site Queue
   * The editor sites's manager email, org name, site name, site id, and bot api key
   * are used to create the site job added to the queue
   * @async
   * @method startCreateEditorSiteTask
   * @param {Object} editorSite - An instance of the model Build Taks
   * * @param {number} editorSite.userEmail - The editor site's manager email for the org
   * * @param {Object} editorSite.orgName - The name of the org
   * * @param {Object} editorSite.siteName - The name of the site
   * * @param {Object} editorSite.siteName - The id of the site
   * * @param {Object} editorSite.apiKey - The bot api key
   * @return {Promise<{Object}>} The bullmq's queue add job response
   */
  async startCreateEditorSiteTask(editorSite) {
    const { userEmail, orgName, siteName, siteId, apiKey } = editorSite;
    const jobName = `Creating editor site for org ${orgName}`;

    await this.createEditorSiteQueue.waitUntilReady();

    return this.createEditorSiteQueue.add(jobName, {
      userEmail,
      orgName,
      siteName,
      siteId,
      apiKey,
    });
  }

  /**
   * Adds a site build job to the Site Builds Queue
   * The build's branch, site owner, and site repository attributes
   * are used to creat the name of the job added to the queue
   * @async
   * @method startSiteBuild
   * @param {Object} build - An instance of the model Build
   * @param {number} build.id - The build primary key
   * @param {string} build.branch - The git branch for the site build
   * @param {Object} build.Site - The build instance's related site
   * @param {string} build.Site.owner - The site's owner
   * @param {string} build.Site.repository - The site's repository
   * @return {Promise<{Object}>} The bullmq's queue add job response
   */
  async startSiteBuild(build, priority) {
    const { branch, id: buildId, Site } = build;
    const { owner, repository } = Site;
    const jobName = `${owner}/${repository}: ${truncateString(branch)}`;

    await this.siteBuildsQueue.waitUntilReady();

    return this.siteBuildsQueue.add(jobName, { buildId }, { priority });
  }
}

module.exports = QueueJobs;
