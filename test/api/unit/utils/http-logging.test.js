const { Writable } = require('stream');
const express = require('express');
const winston = require('winston');
const proxyquire = require('proxyquire');
const request = require('supertest');
const { expect } = require('chai');

describe('HTTP request logging', () => {
  it('omits credentials from request metadata and HTTP messages', async () => {
    let output = '';
    const stream = new Writable({
      write(chunk, encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    class Console extends winston.transports.Stream {
      constructor() {
        super({ stream });
      }
    }
    const loggers = proxyquire('../../../../winston', {
      './config': {
        log: { level: 'info', silent: false },
        app: { appEnv: 'test' },
        '@noCallThru': true,
      },
      winston: { ...winston, transports: { Console }, '@noCallThru': true },
    });
    const app = express();
    app.use(express.json());
    app.use(loggers.expressLogger);
    app.post('/callback', (req, res, next) => {
      // Logging must not remove credentials from the actual authentication request.
      expect(req.query.code).to.equal('query-secret');
      expect(req.headers.cookie).to.equal('sid=cookie-secret');
      expect(req.body.code).to.equal('body-secret');
      next(new Error('Callback failed'));
    });
    app.use(loggers.expressErrorLogger);
    app.use((err, req, res, _next) => res.sendStatus(500));

    await request(app)
      .post('/callback?code=query-secret&state=state-secret')
      .set('Cookie', 'sid=cookie-secret')
      .set('Authorization', 'Bearer header-secret')
      .send({
        code: 'body-secret',
        password: 'password-secret',
        value: 'value-secret',
        nested: { refresh_token: 'refresh-secret' },
      })
      .expect(500);

    [
      'query-secret',
      'state-secret',
      'cookie-secret',
      'header-secret',
      'body-secret',
      'password-secret',
      'value-secret',
      'refresh-secret',
    ].forEach((secret) => {
      expect(output).not.to.contain(secret);
    });
    expect(output).to.contain('HTTP POST /callback');
    expect(output).to.contain('middlewareError');
    expect(output).to.contain('Callback failed');
  });
});
