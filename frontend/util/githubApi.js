import fetch from './fetch';

import store from '../store';
import alertActions from '../actions/alertActions';

const API = 'https://api.github.com';

const getToken = () => {
  const state = store.getState();
  return state.user;
}

const getRepoFor = (site) => {
  return `repos/${site.owner}/${site.repository}`;
};

const github = {
  fetch(path, params) {
    const url = `${API}/${path}`;

    return fetch(url, params).then((data) => {
      return data;
    }).catch((error) => {
      alertActions.httpError(error.message);
    });
  },

  getRepo(site) {
    const url = `${getRepoFor(site)}`;
    return this.fetch(url);
  },

  fetchBranches(site) {
    const url = `${getRepoFor(site)}/branches`;
    return this.fetch(url);
  },
}

export default github;
