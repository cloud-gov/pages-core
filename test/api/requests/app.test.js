const request = require('supertest');
const app = require('../../../app');
const { expect } = require('chai');

const expectRedirect = (hostname, expectedUrl) =>
  new Promise(resolve =>
    request(app)
    .get('/')
    .set('host', hostname)
    .expect(301)
    .then((res) => {
      expect(res.headers.location).to.equal(expectedUrl);
      resolve();
    })
  );

describe('.fr.cloud redirects', () => {
  it('redirects from old .fr.cloud domain to .18f', (done) => {
    Promise.all([
      expectRedirect('federalist-staging.fr.cloud.gov', 'https://federalist-staging.18f.gov'),
      expectRedirect('federalist.fr.cloud.gov', 'https://federalist.18f.gov'),
    ])
    .then(() => done());
  });
});
