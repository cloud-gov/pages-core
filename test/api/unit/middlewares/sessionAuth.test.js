const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');

const config = require('../../../../config');
const sessionAuth = require('../../../../api/middlewares/session-auth');

describe('sessionAuth', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      session: {
        authenticated: true,
        authRedirectPath: '🌋',
        authenticatedAt: new Date(),
        destroy: sinon.spy(),
      },
      logout: sinon.spy(),
    };

    mockNext = sinon.spy();

    mockRes = {
      forbidden: sinon.spy(),
    };
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

  it('logs out the user if authenticatedAt is missing', () => {
    delete mockReq.session.authenticatedAt;
    sessionAuth(mockReq, mockRes, mockNext);
    expect(moment(mockReq.session.authenticatedAt).isSame(moment(), 'second')).to.equal(true);
    expect(mockReq.logout.calledOnce).to.equal(true);
    expect(mockReq.session.authRedirectPath).to.equal(undefined);
  });

  it('logs out the user if authenticatedAt is too old', () => {
    mockReq.session.authenticatedAt = moment().subtract(config.policies.authRevalidationMinutes + 5, 'minutes').toDate();
    sessionAuth(mockReq, mockRes, mockNext);
    expect(mockReq.logout.calledOnce).to.equal(true);
    expect(mockReq.session.authRedirectPath).to.equal(undefined);
  });
});
