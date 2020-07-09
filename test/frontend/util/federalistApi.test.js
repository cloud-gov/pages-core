import chai, { expect } from 'chai';
import chaiFetchMock from 'chai-fetch-mock';
import fetchMock from 'fetch-mock';

import federalistApi, { API } from '../../../frontend/util/federalistApi';

chai.use(chaiFetchMock);

global.fetch = fetchMock;
global.CSRF_TOKEN = 'test-csrf-token';

const testSite = { id: 1 };
const testBranch = 'branchy-branch';
const testBuild = {
  id: 5,
  site: testSite,
  branch: testBranch,
  commitSha: '123abc',
};
const buildLogPage = 1;
const uev = { id: 8 };
const credentials = { username: 'username', password: 'password'};

function testRouteCalled(routeName, { method = 'GET', body } = {}) {
  const expectedOptions = {
    method,
    credentials: 'same-origin',
    headers: {
      'x-csrf-token': 'test-csrf-token',
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };

  if (body) {
    expectedOptions.body = JSON.stringify(body);
  }

  expect(fetchMock).route(routeName).to.have.been.called
    .with.options(expectedOptions);
}

describe('federalistApi', () => {
  before(() => {
    fetchMock.get(`${API}/site/${testSite.id}/build`, { build: true }, { name: 'getBuilds' });
    fetchMock.get(`${API}/build/${testBuild.id}/log/page/${buildLogPage}`, { log: true }, { name: 'getBuildLogs' });
    fetchMock.get(
      `${API}/site/${testSite.id}/published-branch`,
      { branches: [testBranch] }, { name: 'getPublishedBranches' }
    );
    fetchMock.get(
      `${API}/site/${testSite.id}/published-branch/${testBranch}/published-file`,
      { files: [] }, { name: 'getPublishedFiles' }
    );
    fetchMock.get(
      `${API}/site/${testSite.id}/published-branch/${testBranch}/published-file?startAtKey=boop`,
      { files: [] }, { name: 'getPublishedFilesWithQueryParam' }
    );
    fetchMock.get(`${API}/site`, { sites: [testSite] }, { name: 'getSites' });
    fetchMock.get(`${API}/me`, { user: 'me' }, { name: 'getMe' });
    fetchMock.post(`${API}/site`, {}, { name: 'postSite' });
    fetchMock.delete(`${API}/site/2`, {}, { name: 'deleteSite' });
    fetchMock.post(`${API}/build/`, {}, { name: 'postBuild' });
    fetchMock.post(`${API}/site/user`, {}, { name: 'postSiteUser' });
    fetchMock.put(`${API}/site/3`, {}, { name: 'putSite' });
    fetchMock.put(`${API}/site/5`, 400, { name: 'putSiteError' });
    fetchMock.put(`${API}/site/3/notifications`, {}, { name: 'putSiteUser' });
    fetchMock.put(`${API}/site/5/notifications`, 400, { name: 'putSiteUserError' });
    fetchMock.get(`${API}/site/6/user-environment-variable`, [uev], { name: 'fetchUserEnvironmentVariables' });
    fetchMock.post(`${API}/site/6/user-environment-variable`, {}, { name: 'createUserEnvironmentVariable' });
    fetchMock.delete(`${API}/site/6/user-environment-variable/8`, {}, { name: 'deleteUserEnvironmentVariable' });
    fetchMock.get(`${API}/site/8/basic-auth`, credentials, { name: 'fetchBasicAuth' });
    fetchMock.post(`${API}/site/8/basic-auth`, credentials, { name: 'saveBasicAuth' });
    fetchMock.delete(`${API}/site/8/basic-auth`, {}, { name: 'removeBasicAuth' });
  });

  after(() => {
    fetchMock.restore();
  });

  describe('handles errors', () => {
    it('does not throw error by default', (done) => {
      federalistApi.fetch('site/5', { method: 'PUT', data: {} })
        .then(() => {
          expect(true).to.be.true;
          done();
        })
        .catch(() => {
          // should never get here
          expect(false).to.be.true;
          done();
        });
    });

    it('throws an error if handleHttpError is false', (done) => {
      federalistApi.fetch('site/5', { method: 'PUT', data: {} }, { handleHttpError: false })
        .catch((err) => {
          expect(err).to.exist;
          expect(err.response.status).to.equal(400);
          done();
        });
    });
  });

  it('defines fetchBuilds', () => {
    federalistApi.fetchBuilds(testSite);
    testRouteCalled('getBuilds');
  });

  it('defines fetchBuildLogs', () => {
    federalistApi.fetchBuildLogs(testBuild);
    testRouteCalled('getBuildLogs');
  });

  it('defines fetchPublishedBranches', () => {
    federalistApi.fetchPublishedBranches(testSite);
    testRouteCalled('getPublishedBranches');
  });

  describe('fetchPublishedFiles', () => {
    it('is defined', () => {
      federalistApi.fetchPublishedFiles(testSite, testBranch);
      testRouteCalled('getPublishedFiles');
    });

    it('works with the startAtKey param', () => {
      federalistApi.fetchPublishedFiles(testSite, testBranch, 'boop');
      testRouteCalled('getPublishedFilesWithQueryParam');
    });
  });

  it('defines fetchSites', () => {
    federalistApi.fetchSites();
    testRouteCalled('getSites');
  });

  it('defines fetchUser', () => {
    federalistApi.fetchUser();
    testRouteCalled('getMe');
  });

  it('defines addSite', () => {
    const newSite = { id: 2, repository: 'new-site' };
    federalistApi.addSite(newSite);
    testRouteCalled('postSite', { method: 'POST', body: newSite });
  });

  it('defines deleteSite', () => {
    federalistApi.deleteSite(2);
    testRouteCalled('deleteSite', { method: 'DELETE' });
  });

  it('defines addUserToSite', () => {
    const body = { owner: 'hamburger', repository: 'taco' };
    federalistApi.addUserToSite(body);
    testRouteCalled('postSiteUser', { method: 'POST', body });
  });

  it('defines updateSite', () => {
    const site = { id: 3 };
    const body = { defaultBranch: 'paperclip' };
    federalistApi.updateSite(site, body);
    testRouteCalled('putSite', { method: 'PUT', body });
  });

  it('defines updateSiteUser', () => {
    const site = { id: 3 };
    const body = { buildNotificationSetting: 'none' };
    federalistApi.updateSiteUser(site.id, body);
    testRouteCalled('putSiteUser', { method: 'PUT', body });
  });

  describe('restartBuild', () => {
    it('is defined', () => {
      federalistApi.restartBuild(testBuild.id);
      testRouteCalled('postBuild', {
        method: 'POST',
        body: {
          buildId: testBuild.id,
        },
      });
    });
  });

  it('defines fetchUserEnvironmentVariables', () => {
    const siteId = 6;
    federalistApi.fetchUserEnvironmentVariables(siteId);
    testRouteCalled('fetchUserEnvironmentVariables');
  });

  it('defines createUserEnvironmentVariable', () => {
    const siteId = 6;
    federalistApi.createUserEnvironmentVariable(siteId, uev);
    testRouteCalled('createUserEnvironmentVariable', { method: 'POST', body: {} });
  });

  it('defines deleteUserEnvironmentVariable', () => {
    const siteId = 6;
    const uevId = 8;
    federalistApi.deleteUserEnvironmentVariable(siteId, uevId);
    testRouteCalled('deleteUserEnvironmentVariable', { method: 'DELETE' });
  });

  it('defines fetchUserEnvironmentVariables', () => {
    const siteId = 8;
    federalistApi.fetchBasicAuth(siteId);
    testRouteCalled('fetchBasicAuth');
  });

  it('defines createUserEnvironmentVariable', () => {
    const siteId = 8;
    federalistApi.saveBasicAuth(siteId, credentials);
    testRouteCalled('saveBasicAuth', { method: 'POST', body: credentials });
  });

  it('defines deleteUserEnvironmentVariable', () => {
    const siteId = 8;
    federalistApi.removeBasicAuth(siteId);
    testRouteCalled('removeBasicAuth', { method: 'DELETE' });
  });
});
