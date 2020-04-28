const expect = require('chai').expect;
const sinon = require('sinon');
const moment = require('moment');
const proxyquire = require('proxyquire').noCallThru();

const config = require('../../../../config');

describe('sessionAuth', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let sessionAuth;
  let validateUserSpy;

  beforeEach(() => {
    mockReq = {
      session: {
        authenticated: true,
        authRedirectPath: '🌋',
        authenticatedAt: new Date(),
        destroy: sinon.spy(),
      },
      user: {
        githubAccessToken: 'good-token',
      },
      logout: sinon.spy(),
    };

    mockNext = sinon.spy();

    mockRes = {
      forbidden: sinon.spy(),
    };

    validateUserSpy = sinon.spy((token) => {
      if (token === 'good-token') {
        return Promise.resolve();
      }
      return Promise.reject(new Error('user not valid'));
    });

    sessionAuth = proxyquire('../../../../api/policies/sessionAuth', {
      '../services/GitHub': {
        validateUser: validateUserSpy,
      },
    });
  });

  it('calls res.forbidden when not authenticated', (done) => {
    mockReq.session.authenticated = false;
    sessionAuth(mockReq, mockRes, mockNext);
    expect(mockRes.forbidden.calledOnce).to.equal(true);
    expect(mockNext.calledOnce).to.equal(false);
    expect(mockReq.session.authRedirectPath).to.equal(undefined);
    done();
  });

  it('calls next when authenticatedAt is before threshold', (done) => {
    sessionAuth(mockReq, mockRes, mockNext);
    expect(mockNext.calledOnce).to.equal(true);
    expect(mockReq.session.authRedirectPath).to.equal(undefined);
    done();
  });

  it('revalidates the user if authenticatedAt is missing', (done) => {
    delete mockReq.session.authenticatedAt;
    sessionAuth(mockReq, mockRes, mockNext)
      .then(() => {
        expect(moment(mockReq.session.authenticatedAt).isSame(moment(), 'second')).to.equal(true);
        expect(validateUserSpy.calledOnce).to.equal(true);
        expect(mockNext.calledOnce).to.equal(true);
        expect(mockReq.session.authRedirectPath).to.equal(undefined);
        done();
      })
      .catch(done);
  });

  it('revalidates the user if authenticatedAt is too old', (done) => {
    mockReq.session.authenticatedAt = moment().subtract(config.policies.authRevalidationMinutes + 5, 'minutes').toDate();
    sessionAuth(mockReq, mockRes, mockNext)
      .then(() => {
        expect(moment(mockReq.session.authenticatedAt).isSame(moment(), 'second')).to.equal(true);
        expect(validateUserSpy.calledOnce).to.equal(true);
        expect(mockNext.calledOnce).to.equal(true);
        expect(mockReq.session.authRedirectPath).to.equal(undefined);
        done();
      })
      .catch(done);
  });

  it('ends the session and calls res.forbidden if the user is no longer valid', (done) => {
    mockReq.session.authenticatedAt = moment().subtract(config.policies.authRevalidationMinutes + 5, 'minutes').toDate();
    mockReq.user.githubAccessToken = 'bad-user-token';

    sessionAuth(mockReq, mockRes, mockNext)
      .then(() => {
        expect(validateUserSpy.calledOnce).to.equal(true);
        expect(mockReq.logout.calledOnce).to.equal(true);
        expect(mockReq.session.destroy.calledOnce).to.equal(true);
        expect(mockNext.notCalled).to.equal(true);
        expect(mockRes.forbidden.calledOnce).to.equal(true);
        done();
      })
      .catch(done);
  });
});
