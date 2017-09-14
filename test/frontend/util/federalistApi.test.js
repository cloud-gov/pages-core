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
    fetchMock.get(`${API}/build/${testBuild.id}/log`, { log: true }, { name: 'getBuildLogs' });
    fetchMock.get(
      `${API}/site/${testSite.id}/published-branch`,
      { branches: [testBranch] }, { name: 'getPublishedBranches' });
    fetchMock.get(
      `${API}/site/${testSite.id}/published-branch/${testBranch}/published-file`,
      { files: [] }, { name: 'getPublishedFiles' });
    fetchMock.get(`${API}/site`, { sites: [testSite] }, { name: 'getSites' });
    fetchMock.get(`${API}/me`, { user: 'me' }, { name: 'getMe' });
    fetchMock.post(`${API}/site`, {}, { name: 'postSite' });
    fetchMock.delete(`${API}/site/2`, {}, { name: 'deleteSite' });
    fetchMock.post(`${API}/build/`, {}, { name: 'postBuild' });
  });

  after(() => {
    fetchMock.restore();
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

  it('defines fetchPublishedFiles', () => {
    federalistApi.fetchPublishedFiles(testSite, testBranch);
    testRouteCalled('getPublishedFiles');
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

  describe('restartBuild', () => {
    it('is defined', () => {
      federalistApi.restartBuild(testBuild);
      testRouteCalled('postBuild', {
        method: 'POST',
        body: {
          site: testSite.id,
          branch: testBranch,
          commitSha: testBuild.commitSha,
        },
      });
    });

    it('works when build site is not an object', () => {
      const boopBuild = Object.assign({}, testBuild);
      boopBuild.site = 123;
      federalistApi.restartBuild(boopBuild);
      testRouteCalled('postBuild', {
        method: 'POST',
        body: {
          site: 123,
          branch: testBranch,
          commitSha: testBuild.commitSha,
        },
      });
    });
  });
});
