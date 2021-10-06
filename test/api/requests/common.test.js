const { expect } = require('chai');
const request = require('supertest');

const app = require('../../../app');
const config = require('../../../config');

const commonPaths = [
  '/', // the home page
];

commonPaths.forEach((path) => {
  describe(`${path} - common request tests`, () => {
    it('should include a cache-control header', (done) => {
      request(app)
        .get(path)
        .then((response) => {
          expect(response.headers).to.have.property('cache-control', 'max-age=0');
          done();
        })
        .catch(done);
    });

    describe('tracking scripts', () => {
      const prodTrackingScripts = [
        'https://dap.digitalgov.gov/Universal-Federated-Analytics-Min.js?agency=GSA&subagency=TTS,Federalist',
      ];

      const origAppEnv = config.app.app_env;

      after(() => {
        // reset config.app.app_env to its original value
        config.app.app_env = origAppEnv;
      });

      it('should have tracking scripts when app_env is production', (done) => {
        config.app.app_env = 'production';

        request(app)
          .get(path)
          .then((response) => {
            prodTrackingScripts.forEach((script) => {
              expect(response.text.indexOf(script), `${script} not found`).to.be.above(-1);
            });
            done();
          })
          .catch(done);
      });

      it('should not have tracking scripts when not in production mode', (done) => {
        config.app.app_env = 'development';

        request(app)
          .get(path)
          .then((response) => {
            prodTrackingScripts.forEach((script) => {
              expect(response.text.indexOf(script), `${script} was found`).to.equal(-1);
            });
            done();
          })
          .catch(done);
      });
    });

    describe('<title> element', () => {
      const origAppEnv = config.app.app_env;

      after(() => {
        // reset config.app.app_env to its original value
        config.app.app_env = origAppEnv;
      });

      it('should display the app_env in the title element', (done) => {
        config.app.app_env = 'testing123';
        request(app)
          .get(path)
          .then((response) => {
            const titleRegex = /<title>\s*Federalist \| testing123\s*<\/title>/g;
            expect(response.text.search(titleRegex)).to.be.above(-1);
            done();
          })
          .catch(done);
      });

      it('should not display the app_env in the title when it is "production"', (done) => {
        config.app.app_env = 'production';
        request(app)
          .get(path)
          .then((response) => {
            const titleRegex = /<title>\s*Federalist\s*<\/title>/g;
            expect(response.text.search(titleRegex)).to.be.above(-1);
            done();
          })
          .catch(done);
      });
    });
  });
});
