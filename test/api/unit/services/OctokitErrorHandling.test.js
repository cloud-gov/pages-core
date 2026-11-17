const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const respondWithError = require('../../../../api/responses/error');

describe('Octokit error handling', () => {
  const githubError = () => {
    const error = new Error('GitHub request failed');
    error.name = 'HttpError';
    error.status = 403;
    Object.defineProperty(error, 'code', {
      get() {
        throw new Error('Deprecated error.code getter must not be accessed');
      },
    });
    return error;
  };

  const eventCreator = () =>
    proxyquire('../../../../api/services/EventCreator', {
      '../utils': { '@noCallThru': true },
      '../../winston': { logger: { error: sinon.stub() }, '@noCallThru': true },
      '../models': {
        Event: {
          types: { ERROR: 'error' },
          create: sinon.stub().callsFake(async (event) => event),
        },
        '@noCallThru': true,
      },
    });

  it('stores HTTP status without accessing the deprecated code getter', async () => {
    const event = await eventCreator().error('request-handler', githubError());
    expect(event.body.error).to.deep.equal({ name: 'HttpError', code: 403 });
  });

  it('preserves codes for non-HTTP errors without a status', async () => {
    const error = new Error('Connection failed');
    error.code = 'ECONNREFUSED';
    const event = await eventCreator().error('request-handler', error);
    expect(event.body.error.code).to.equal('ECONNREFUSED');
  });

  it('handles an Octokit response without accessing its code getter', () => {
    const res = { forbidden: sinon.spy() };
    const error = githubError();
    respondWithError(error, { res });
    sinon.assert.calledOnceWithExactly(res.forbidden, error);
  });

  it('preserves CSRF handling even when the error already has a status', () => {
    const res = { forbidden: sinon.spy() };
    const error = new Error('Invalid token');
    error.code = 'EBADCSRFTOKEN';
    error.status = 403;
    respondWithError(error, { res });
    sinon.assert.calledOnceWithExactly(res.forbidden, {
      status: 403,
      message: 'Invalid CSRF token',
    });
  });
});
