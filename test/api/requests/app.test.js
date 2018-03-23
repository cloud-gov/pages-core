const request = require('supertest');
const app = require('../../../app');
const { expect } = require('chai');

const expectRedirect = (hostname, pathname = '', expectedUrl) =>
  new Promise(resolve =>
    request(app)
    .get('/')
    .set('host', hostname)
    .set('path', pathname)
    .expect(301)
    .then((res) => {
      expect(res.headers.location).to.equal(expectedUrl);
      resolve();
    })
  );

describe.only('.fr.cloud redirects', () => {
  it('redirects from old .fr.cloud domain to .18f', (done) => {
    const path = '/preview/my-great/path';
    const stagingUrl = `federalist-staging.fr.cloud.gov${path}`;
    const expectedUrl =`https://federalist-staging.18f.gov${path}`;

    Promise.all([
      expectRedirect(stagingUrl, path, expectedUrl),
      expectRedirect('federalist.fr.cloud.gov', '', 'https://federalist.18f.gov'),
    ])
    .then(() => done())
    .catch((error) => {
      console.log(error);
      done();
    });
  });
});
