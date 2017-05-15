import fetch from './fetch';

import store from '../store';
import alertActions from '../actions/alertActions';

const API = 'https://api.github.com';

const getRepoFor = (site) => {
  return `repos/${site.owner}/${site.repository}`;
};

const github = {
  fetch(path, params) {
    const url = `${API}/${path}`;

    return fetch(url, params).then((data) => {
      return data;
    });
  },

  fetchBranches(site) {
    const url = `${getRepoFor(site)}/branches`;
    return this.fetch(url);
  },
}

export default github;
