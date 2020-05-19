const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const proxyquire = require('proxyquire').noCallThru();

const config = require('../../../../config');

describe('adminSessionAuth', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let sessionAuth;
  let validateAdminSpy;

  beforeEach(() => {
    mockReq = {
      session: {
        adminAuthenticated: true,
        authRedirectPath: '🌋',
        adminAuthenticatedAt: new Date(),
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

    validateAdminSpy = sinon.spy((token) => {
      if (token === 'good-token') {
        return Promise.resolve();
      }
      return Promise.reject(new Error('user not valid'));
    });

    sessionAuth = proxyquire('../../../../api/policies/adminSessionAuth', {
      '../services/GitHub': {
        validateAdmin: validateAdminSpy,
      },
    });
  });

  it('calls res.forbidden when not authenticated', (done) => {
    mockReq.session.adminAuthenticated = false;
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
    delete mockReq.session.adminAuthenticatedAt;
    sessionAuth(mockReq, mockRes, mockNext)
      .then(() => {
        expect(mockReq.session.adminAuthenticatedAt).to.exist;
        expect(moment(mockReq.session.adminAuthenticatedAt).isSame(moment(), 'second')).to.equal(true);
        expect(validateAdminSpy.calledOnce).to.equal(true);
        expect(mockNext.calledOnce).to.equal(true);
        expect(mockReq.session.authRedirectPath).to.equal(undefined);
        done();
      })
      .catch(done);
  });

  it('revalidates the user if authenticatedAt is too old', (done) => {
    mockReq.session.adminAuthenticatedAt = moment().subtract(config.policies.authRevalidationMinutes + 5, 'minutes').toDate();
    sessionAuth(mockReq, mockRes, mockNext)
      .then(() => {
        expect(moment(mockReq.session.adminAuthenticatedAt).isSame(moment(), 'second')).to.equal(true);
        expect(validateAdminSpy.calledOnce).to.equal(true);
        expect(mockNext.calledOnce).to.equal(true);
        expect(mockReq.session.authRedirectPath).to.equal(undefined);
        done();
      })
      .catch(done);
  });

  it('ends the session and calls res.forbidden if the user is no longer valid', (done) => {
    mockReq.session.adminAuthenticatedAt = moment().subtract(config.policies.authRevalidationMinutes + 5, 'minutes').toDate();
    mockReq.user.githubAccessToken = 'bad-user-token';

    sessionAuth(mockReq, mockRes, mockNext)
      .then(() => {
        expect(validateAdminSpy.calledOnce).to.equal(true);
        expect(mockReq.logout.calledOnce).to.equal(true);
        expect(mockReq.session.destroy.calledOnce).to.equal(true);
        expect(mockNext.notCalled).to.equal(true);
        expect(mockRes.forbidden.calledOnce).to.equal(true);
        done();
      })
      .catch(done);
  });
});
