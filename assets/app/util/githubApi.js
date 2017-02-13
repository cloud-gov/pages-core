import fetch from './fetch';

import store from '../store';
import alertActions from '../actions/alertActions';

const API = 'https://api.github.com';

const getToken = () => {
  const state = store.getState();
  return state.user.githubAccessToken;
}

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

  getRepo(site) {
    const url = `${getRepoFor(site)}`;
    const params = { access_token: getToken() };

    return this.fetch(url, { params });
  },

  fetchBranches(site) {
    const url = `${getRepoFor(site)}/branches`;
    const params = {
      access_token: getToken()
    };

    return this.fetch(url, { params });
  },

  createRepo(destination, source) {
    const token = getToken();
    const params = {
      access_token: token
    };
    const sourceUrl = `repos/${source.owner}/${source.repo}`;

    function createRepo(destination) {
      const org = destination.organization ?
        `orgs/${destination.organization}` : 'user';

      const repoUrl = `${org}/repos`;

      return this.fetch(repoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`
        },
        data: {
          name: destination.repository
        }
      });
    }

    return this.fetch(sourceUrl, { params })
      .then(createRepo.bind(this, destination));
  }
}

export default github;
