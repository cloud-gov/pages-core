const expect = require('chai').expect;
const factory = require('../../support/factory');
const { userLoggedIn, userLoggedOut } = require('../../../../api/services/EventCreator');

describe('EventCreateor', () => {
  
  it('.UserLoggedIn', (done) => {
    factory.user()
      .then(user => userLoggedIn(user)
        .then((event) => {
          expect(event.type).to.equal('audit');
          expect(event.label).to.equal('authentication');
          expect(event.model).to.equal('User');
          expect(event.modelId).to.equal(user.id);
          expect(event.body.action).to.equal('login');
          done();
        }));  
  });

  it('.UserLoggedOut', (done) => {
    factory.user()
      .then(user => userLoggedOut(user)
        .then((event) => {
          expect(event.type).to.equal('audit');
          expect(event.label).to.equal('authentication');
          expect(event.model).to.equal('User');
          expect(event.modelId).to.equal(user.id);
          expect(event.body.action).to.equal('logout');
          done();
        }));  
  });
});
