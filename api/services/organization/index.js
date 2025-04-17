const OrganizationService = require('./Organization');

module.exports = {
  createOrganization: OrganizationService.createOrganization.bind(OrganizationService),
  setupSiteEditorOrganization:
    OrganizationService.setupSiteEditorOrganization.bind(OrganizationService),
  inviteUserToOrganization:
    OrganizationService.inviteUserToOrganization.bind(OrganizationService),
  resendInvite: OrganizationService.resendInvite.bind(OrganizationService),
  deactivateOrganization:
    OrganizationService.deactivateOrganization.bind(OrganizationService),
  activateOrganization:
    OrganizationService.activateOrganization.bind(OrganizationService),
};
