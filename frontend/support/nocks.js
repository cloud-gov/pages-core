import nock from 'nock';
import { builds } from '../../test/frontend/support/data/builds';

const BASE_URL = 'http://localhost:80';

export function getSiteBuilds(siteId) {
  return nock(BASE_URL).get(`/v0/site/${siteId}/build`).reply(200, builds);
}

export function getSiteBuildsError(siteId) {
  return nock(BASE_URL).get(`/v0/site/${siteId}/build`).reply(500, new Error());
}

export function postSiteBuild(siteId, buildId) {
  const matcher = (body) => {
    return body.siteId === siteId && body.buildId === buildId;
  };

  return nock(BASE_URL).post(`/v0/build/`, matcher).reply(200, builds);
}
