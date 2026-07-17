process.env.APP_ENV = 'dev';
process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';

const { expect } = require('chai');
const { validateEnvVar, getRequiredEnvVars } = require('../../config/envVarValidator');

describe('EnvVarValidator', () => {
  describe('validateEnvVar(envVar, envVarName)', () => {
    describe('for a variable from the required list ', () => {
      it('should return value if valid', async () => {
        expect(
          validateEnvVar('01234567890123456789012345678901', 'FEDERALIST_SESSION_SECRET'),
        ).to.equal('01234567890123456789012345678901');
      });
      it('should throw error if no value', async () => {
        expect(() => validateEnvVar('', 'FEDERALIST_SESSION_SECRET')).to.throw(
          // eslint-disable-next-line max-len
          'FATAL: FEDERALIST_SESSION_SECRET is required. Ensure the pages-dev service is bound correctly.',
        );
      });
      it('should throw error if secret is short', async () => {
        expect(() =>
          validateEnvVar('0123456789012345678901234567890', 'FEDERALIST_SESSION_SECRET'),
        ).to.throw('FATAL: FEDERALIST_SESSION_SECRET must be at least 32 characters.');
      });
    });

    describe('for a variable not from the required list ', () => {
      it('should return a value', async () => {
        expect(
          validateEnvVar(
            '01234567890123456789012345678901',
            'FEDERALIST_SESSION_SECRET_',
          ),
        ).to.equal('01234567890123456789012345678901');
      });
      it('should not throw an error', async () => {
        expect(validateEnvVar('', 'FEDERALIST_SESSION_SECRET_')).to.equal('');
      });
    });
    describe('for a variable protected by the feature flag', () => {
      it('should not throw error if no value and flag is off', async () => {
        process.env.FEATURE_WORKSHOP_INTEGRATION = 'false';
        expect(validateEnvVar('', 'GITLAB_WEBHOOK_SECRET')).to.equal('');
      });
      it('should throw error if no value and flag is on', async () => {
        process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
        expect(() => validateEnvVar('', 'GITLAB_WEBHOOK_SECRET')).to.throw(
          // eslint-disable-next-line max-len
          'FATAL: GITLAB_WEBHOOK_SECRET is required. Ensure the pages-dev service is bound correctly.',
        );
      });
    });
  });
  describe('getRequiredEnvVars()', () => {
    it('should include GITLAB_WEBHOOK_SECRET if flag is on', async () => {
      process.env.FEATURE_WORKSHOP_INTEGRATION = 'true';
      expect(getRequiredEnvVars()).to.deep.equal([
        'FEDERALIST_SESSION_SECRET',
        'GITHUB_WEBHOOK_SECRET',
        'GITLAB_WEBHOOK_SECRET',
      ]);
    });
    it('should not include GITLAB_WEBHOOK_SECRET if flag is off', async () => {
      process.env.FEATURE_WORKSHOP_INTEGRATION = 'false';
      expect(getRequiredEnvVars()).to.deep.equal([
        'FEDERALIST_SESSION_SECRET',
        'GITHUB_WEBHOOK_SECRET',
      ]);
    });
  });
});
