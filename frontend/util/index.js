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
  return Object.values(logs).map(value => value[0]?.output || []);
  // return logs.reduce((groups, log) => {
  //   // eslint-disable-next-line no-param-reassign
  //   groups[log.source] = (groups[log.source] || []).concat([log.output]);
  //   return groups;
  // }, {});
}

export function sandboxMsg(days, content = null) {
  let timeframe = `${days} days`;
  if (days === 1) {
    timeframe = `${days} day`;
  }
  const str = content ? ` ${content} ` : ' ';
  return `All${str}data for this sandbox organization will be removed in ${timeframe}.`;
}
