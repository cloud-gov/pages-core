import fetch from './fetch';

const API = 'https://api.github.com';

const getRepoFor = (site) => `repos/${site.owner}/${site.repository}`;

const github = {
  fetch(path, params) {
    const url = `${API}/${path}`;
    return fetch(url, params);
  },

  fetchBranches(site) {
    const url = `${getRepoFor(site)}/branches`;
    return this.fetch(url);
  },
};

export default github;
