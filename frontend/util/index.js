// We'll have other exported functions here eventually
// so prefer-default-export is disabled here for now
// eslint-disable-next-line import/prefer-default-export
export function getSafeRepoName(name) {
  return name
    .replace(/[^\w.]+/g, '-') // replace non-alphabetic and periods with hyphens
    .replace(/^-+/g, '') // remove starting hyphens
    .replace(/-+$/g, ''); // remove ending hyphens
}

export function groupLogs(logs) {
  return logs.reduce((groups, log) => {
    // eslint-disable-next-line no-param-reassign
    groups[log.source] = (groups[log.source] || []).concat([log.output]);
    return groups;
  }, {});
}

const sandboxMsg = (days, isSite = false) => {
  let msg = `${days} days`;
  if (days === 1) {
    msg = `${days} day`;
  }
  return `All data for this sandbox organization${isSite ? ' site ' : ' '}will be removed in ${msg}.`;
};

export function sandboxOrgMsg(days) {
  return sandboxMsg(days);
}

export function sandboxSiteMsg(days) {
  return sandboxMsg(days, true);
}
