const domainBranch = (domain) => domain.SiteBranchConfig.branch;
const domainContext = (domain) => domain.SiteBranchConfig.context;

export const selectSiteDomains = (site) => {
  const { Domains: domains, SiteBranchConfigs: siteBranchConfigs } = site;
  return domains.map((domain) => {
    const {
      id, names, state, siteBranchConfigId, createdAt, updatedAt,
    } = domain;
    const { branch, context } = siteBranchConfigs.find(
      (sbc) => sbc.id === siteBranchConfigId,
    );

    return {
      id,
      context,
      names,
      state,
      siteBranchConfigId,
      branch,
      createdAt,
      updatedAt,
    };
  });
};

export const selectSiteLinks = (site) => {
  const {
    Domains: domains,
    SiteBranchConfigs: siteBranchConfigs,
    siteOrigin,
  } = site;

  return siteBranchConfigs.map((sbc) => {
    const { id, context, s3Key } = sbc;
    const domain = domains.find((d) => d.siteBranchConfigId === id);

    if (domain) {
      const domainName = domain.names.split(',')[0];

      return {
        context,
        url: `https://${domainName}`,
      };
    }

    return {
      context,
      url: `${siteOrigin}${s3Key}`,
    };
  });
};

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
