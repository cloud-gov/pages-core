const domainBranch = (domain) => domain.SiteBranchConfig.branch;
const domainContext = (domain) => domain.SiteBranchConfig.context;

const stateColor = (state) => ({
  pending: 'bg-gray-30',
  provisioning: 'bg-gold',
  failed: 'bg-red',
  provisioned: 'bg-mint',
  deprovisioning: 'bg-gold',
}[state] || 'bg-gray-30');

function formToObj(form) {
  return [...form.elements]
    .filter((e) => e.name)
    .reduce((acc, e) => ({ ...acc, [e.name]: e.value }), {});
}

function objToQueryString(obj = {}) {
  const searchParams = new URLSearchParams();
  Object.keys(obj).forEach((key) => {
    searchParams.set(key, obj[key]);
  });
  return searchParams.toString();
}

function siteName(site) {
  return `${site.owner}/${site.repository}`;
}

export {
  domainBranch,
  domainContext,
  formToObj,
  objToQueryString,
  siteName,
  stateColor,
};
