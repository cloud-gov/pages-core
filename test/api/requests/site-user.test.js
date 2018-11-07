// const crypto = require('crypto');
// const { expect } = require('chai');
// const nock = require('nock');
// const request = require('supertest');
// const sinon = require('sinon');

// const app = require('../../../app');
// const factory = require('../support/factory');
// const githubAPINocks = require('../support/githubAPINocks');
// const { authenticatedSession, unauthenticatedSession } = require('../support/session');
// const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
// const csrfToken = require('../support/csrfToken');

// const { Build, Site, User } = require('../../../api/models');
// const S3SiteRemover = require('../../../api/services/S3SiteRemover');
// const siteErrors = require('../../../api/responses/siteErrors');

// const authErrorMessage = 'You are not permitted to perform this action. Are you sure you are logged in?';

// describe('SiteUser API', () => {
//   const siteResponseExpectations = (response, site) => {
//     expect(response.owner).to.equal(site.owner);
//     expect(response.repository).to.equal(site.repository);
//     expect(response.engine).to.equal(site.engine);
//     expect(response.defaultBranch).to.equal(site.defaultBranch);
//     expect(response.viewLink).to.be.a('string');
//   };

//   describe('PUT /v0/siteUser/:id', () => {
//     // it('should require authentication', (done) => {
//     //   let site;

//     //   factory.site()
//     //     .then((model) => {
//     //       site = model;
//     //       return unauthenticatedSession();
//     //     })
//     //     .then(cookie => request(app)
//     //       .put(`/v0/site/${site.id}`)
//     //       .set('x-csrf-token', csrfToken.getToken())
//     //       .send({
//     //         defaultBranch: 'master',
//     //       })
//     //       .set('Cookie', cookie)
//     //       .expect(403)
//     //     )
//     //     .then((response) => {
//     //       validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
//     //       expect(response.body.message).to.equal(authErrorMessage);
//     //       done();
//     //     })
//     //     .catch(done);
//     // });

//     // it('should require a valid csrf token', (done) => {
//     //   let site;

//     //   factory.site()
//     //     .then((model) => {
//     //       site = model;
//     //       return authenticatedSession();
//     //     })
//     //     .then(cookie => request(app)
//     //       .put(`/v0/site/${site.id}`)
//     //       .set('x-csrf-token', 'bad-token')
//     //       .send({
//     //         defaultBranch: 'master',
//     //       })
//     //       .set('Cookie', cookie)
//     //       .expect(403)
//     //     )
//     //     .then((response) => {
//     //       validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
//     //       expect(response.body.message).to.equal('Invalid CSRF token');
//     //       done();
//     //     })
//     //     .catch(done);
//     // });

//     it('should allow a user to update a site associated with their account', (done) => {
//       let site;
//       let response;
//         factory.site({
//           users: Promise.all([factory.user()]),
//         })
//         .then(s => Site.findById(s.id, { include: [User] }))
//         .then((model) => {
// console.log(`\n\n\nmodel:\t${JSON.stringify(model)}\n\n\n\n`);          
//           site = model;
//           return authenticatedSession(site.Users[0]);
//         })
//         .then(cookie => request(app)
//           .put(`/v0/siteUser/${site.id}`)
//           .set('x-csrf-token', csrfToken.getToken())
//           .send({ buildNotify: 'site' })
//           .set('Cookie', cookie)
//           .expect(200)
//         )
//         .then((resp) => {
//           response = resp;
//           return Site.findById(site.id, { include: [User] });
//         })
//         .then((foundSite) => {
//           validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);

//           expect(response.body.config).to.equal('new-config');
//           expect(foundSite.config).to.equal('new-config');
//           expect(response.body.demoConfig).to.equal('new-demo-config');
//           expect(foundSite.demoConfig).to.equal('new-demo-config');
//           expect(response.body.previewConfig).to.equal('new-preview-config');
//           expect(foundSite.previewConfig).to.equal('new-preview-config');
//           siteResponseExpectations(response.body, foundSite);
//           done();
//         })
//         .catch(done);
//     });

//     // it('should not allow a user to update a site not associated with their account', (done) => {
//     //   let siteModel;
//     //   factory.site({ repository: 'old-repo-name' })
//     //     .then(site => Site.findById(site.id))
//     //     .then((model) => {
//     //       siteModel = model;
//     //       return authenticatedSession(factory.user());
//     //     })
//     //     .then(cookie => request(app)
//     //         .put(`/v0/site/${siteModel.id}`)
//     //         .set('x-csrf-token', csrfToken.getToken())
//     //         .send({
//     //           repository: 'new-repo-name',
//     //         })
//     //         .set('Cookie', cookie)
//     //         .expect(403)
//     //     )
//     //     .then((response) => {
//     //       validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
//     //       return Site.findById(siteModel.id);
//     //     })
//     //     .then((site) => {
//     //       expect(site).to.have.property('repository', 'old-repo-name');
//     //       done();
//     //     })
//     //     .catch(done);
//     // });

//     // it('should trigger a rebuild of the site', (done) => {
//     //   let siteModel;
//     //   factory.site({ repository: 'old-repo-name' })
//     //     .then(site => Site.findById(site.id, { include: [User, Build] }))
//     //     .then((model) => {
//     //       siteModel = model;
//     //       expect(siteModel.Builds).to.have.length(0);
//     //       return authenticatedSession(siteModel.Users[0]);
//     //     })
//     //     .then(cookie => request(app)
//     //       .put(`/v0/site/${siteModel.id}`)
//     //       .set('x-csrf-token', csrfToken.getToken())
//     //       .send({
//     //         repository: 'new-repo-name',
//     //       })
//     //       .set('Cookie', cookie)
//     //       .expect(200)
//     //     )
//     //     .then(() => Site.findById(siteModel.id, { include: [User, Build] }))
//     //     .then((site) => {
//     //       expect(site.Builds).to.have.length(1);
//     //       expect(site.Builds[0].branch).to.equal(site.defaultBranch);
//     //       done();
//     //     })
//     //     .catch(done);
//     // });

//     // it('should trigger a rebuild of the demo branch if one is present', (done) => {
//     //   let siteModel;
//     //   factory.site({
//     //     repository: 'old-repo-name',
//     //     demoBranch: 'demo',
//     //     demoDomain: 'https://demo.example.gov',
//     //   })
//     //   .then(site => Site.findById(site.id, { include: [User, Build] }))
//     //   .then((model) => {
//     //     siteModel = model;
//     //     expect(siteModel.Builds).to.have.length(0);
//     //     return authenticatedSession(siteModel.Users[0]);
//     //   })
//     //   .then(cookie => request(app)
//     //     .put(`/v0/site/${siteModel.id}`)
//     //     .set('x-csrf-token', csrfToken.getToken())
//     //     .send({
//     //       repository: 'new-repo-name',
//     //     })
//     //     .set('Cookie', cookie)
//     //     .expect(200)
//     //   )
//     //   .then(() => Site.findById(siteModel.id, { include: [User, Build] }))
//     //   .then((site) => {
//     //     expect(site.Builds).to.have.length(2);
//     //     const demoBuild = site.Builds.find(
//     //       candidateBuild => candidateBuild.branch === site.demoBranch);
//     //     expect(demoBuild).to.not.be.undefined;
//     //     done();
//     //   })
//     //   .catch(done);
//     // });

//     // it('should update attributes when the value in the request body is an empty string', (done) => {
//     //   let site;
//     //   const userPromise = factory.user();
//     //   const sitePromise = factory.site({
//     //     users: Promise.all([userPromise]),
//     //     config: 'old-config: true',
//     //     domain: 'https://example.com',
//     //   });
//     //   const cookiePromise = authenticatedSession(userPromise);

//     //   Promise.props({
//     //     user: userPromise,
//     //     site: sitePromise,
//     //     cookie: cookiePromise,
//     //   })
//     //   .then((results) => {
//     //     site = results.site;

//     //     return request(app)
//     //       .put(`/v0/site/${site.id}`)
//     //       .set('x-csrf-token', csrfToken.getToken())
//     //       .send({
//     //         config: '',
//     //         domain: '',
//     //       })
//     //       .set('Cookie', results.cookie)
//     //       .expect(200);
//     //   })
//     //   .then((response) => {
//     //     validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
//     //     return Site.findById(site.id);
//     //   })
//     //   .then((foundSite) => {
//     //     expect(foundSite.config).to.equal('');
//     //     expect(foundSite.domain).to.equal('');
//     //     done();
//     //   })
//     //   .catch(done);
//     // });

//     // it('should not override existing attributes if they are not present in the request body', (done) => {
//     //   let site;
//     //   const userPromise = factory.user();
//     //   const sitePromise = factory.site({
//     //     users: Promise.all([userPromise]),
//     //     config: 'old-config: true',
//     //     domain: 'https://example.com',
//     //   });
//     //   const cookiePromise = authenticatedSession(userPromise);

//     //   Promise.props({
//     //     user: userPromise,
//     //     site: sitePromise,
//     //     cookie: cookiePromise,
//     //   })
//     //   .then((results) => {
//     //     site = results.site;

//     //     return request(app)
//     //       .put(`/v0/site/${site.id}`)
//     //       .set('x-csrf-token', csrfToken.getToken())
//     //       .send({
//     //         config: 'new-config: true',
//     //       })
//     //       .set('Cookie', results.cookie)
//     //       .expect(200);
//     //   })
//     //   .then((response) => {
//     //     validateAgainstJSONSchema('PUT', '/site/{id}', 200, response.body);
//     //     return Site.findById(site.id);
//     //   })
//     //   .then((foundSite) => {
//     //     expect(foundSite.config).to.equal('new-config: true');
//     //     expect(foundSite.domain).to.equal('https://example.com');
//     //     done();
//     //   })
//     //   .catch(done);
//     // });

//     // it('should respond with an error if config values are not valid YAML', (done) => {
//     //   let site;
//     //   const userPromise = factory.user();
//     //   const sitePromise = factory.site({
//     //     users: Promise.all([userPromise]),
//     //   });
//     //   const cookiePromise = authenticatedSession(userPromise);

//     //   Promise.props({
//     //     user: userPromise,
//     //     site: sitePromise,
//     //     cookie: cookiePromise,
//     //   })
//     //     .then((results) => {
//     //       site = results.site;

//     //       return request(app)
//     //         .put(`/v0/site/${site.id}`)
//     //         .set('x-csrf-token', csrfToken.getToken())
//     //         .send({
//     //           config: ': badyaml1',
//     //           demoConfig: ': badyaml2',
//     //           previewConfig: ': badyaml3',
//     //         })
//     //         .set('Cookie', results.cookie)
//     //         .expect(403);
//     //     })
//     //     .then((response) => {
//     //       expect(response.body.message).to.equal([
//     //         'config: input is not valid YAML',
//     //         'previewConfig: input is not valid YAML',
//     //         'demoConfig: input is not valid YAML',
//     //       ].join('\n'));
//     //       validateAgainstJSONSchema('PUT', '/site/{id}', 403, response.body);
//     //       done();
//     //     })
//     //     .catch(done);
//     // });
//   });
// });
