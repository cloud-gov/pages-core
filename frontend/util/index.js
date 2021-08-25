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

export function sandboxOrgMsg(days) {
  let msg;
  if (days > 1) {
    msg = `${days} days`;
  } else if (days === 1) {
    msg = `${days} day`;
  }
  return `All data for this sandbox organization will be deleted in ${msg}.`;
}

export function sandboxSiteMsg(days) {
  let msg;
  if (days > 1) {
    msg = `${days} days`;
  } else if (days === 1) {
    msg = `${days} day`;
  }
  return `All data for this sandbox organization site will be deleted in ${msg}.`;
}
