export function getSafeRepoName(name) {
  return (
    name
      .replace(/[^\w.]+/g, '-') // replace non-alphabetic and periods with hyphens
      .replace(/^-+/g, '') // remove starting hyphens
      // eslint-disable-next-line sonarjs/slow-regex
      .replace(/-+$/g, '')
  ); // remove ending hyphens
}

export function groupLogs(logs) {
  return logs.reduce((groups, log) => {
    groups[log.source] = (groups[log.source] || []).concat([log.output]);
    return groups;
  }, {});
}

export function sandboxMsg(days, content = null) {
  let timeframe = `${days} days`;
  if (days === 1) {
    timeframe = `${days} day`;
  }
  const str = content ? ` ${content} ` : ' ';
  return `All${str}data for this sandbox organization will be removed in ${timeframe}.`;
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
