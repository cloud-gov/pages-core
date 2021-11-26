export const domainBranch = (domain) => (domain.context === 'site'
  ? domain.Site.defaultBranch
  : domain.Site.demoBranch);

export const stateColor = (state) => ({
  pending: 'bg-gray-30',
  provisioning: 'bg-gold',
  failed: 'bg-red',
  provisioned: 'bg-mint',
  deprovisioning: 'bg-gold',
}[state] || 'bg-gray-30');

export default {
  domainBranch,
  stateColor,
};
