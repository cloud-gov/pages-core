const OrganizationService = require('./Organization');

module.exports = {
  createOrganization: OrganizationService.createOrganization.bind(OrganizationService),
  inviteUserToOrganization: OrganizationService.inviteUserToOrganization.bind(OrganizationService),
  inviteUserToPlatform: OrganizationService.inviteUserToPlatform.bind(OrganizationService),
  resendInvite: OrganizationService.resendInvite.bind(OrganizationService),
};
