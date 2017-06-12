
// We'll have other exported functions here eventually
// so prefer-default-export is disabled here for now
// eslint-disable-next-line import/prefer-default-export
export function getSafeRepoName(name) {
  return name
    .replace(/[^\w.]+/g, '-') // replace non-alphabetic and periods with hyphens
    .replace(/^-+/g, '') // remove starting hyphens
    .replace(/-+$/g, ''); // remove ending hyphens
}
