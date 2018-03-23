const request = require('supertest');
const app = require('../../../app');
const { expect } = require('chai');

const expectRedirect = (hostname, pathname = '/', expectedUrl) =>
  new Promise(resolve =>
    request(app)
    .get(pathname)
    .set('host', hostname)
    .expect(301)
    .then((res) => {
      expect(res.headers.location).to.equal(expectedUrl);
      resolve();
    })
  );

describe('.fr.cloud redirects', () => {
  it('redirects from old .fr.cloud domain to .18f', (done) => {
    const stagingPath = '/preview/my-great/path';
    const stagingUrl = 'federalist-staging.fr.cloud.gov';
    const expectedUrl =`https://federalist-staging.18f.gov${stagingPath}`;

    Promise.all([
      expectRedirect(stagingUrl, stagingPath, expectedUrl),
      expectRedirect('federalist.fr.cloud.gov', '', 'https://federalist.18f.gov/'),
    ])
    .then(() => done())
    .catch((error) => {
      console.warn(error);
      done();
    });
  });
});
