const { expect } = require('chai');
const Features = require('../../../api/features');

describe('Features', () => {
  beforeEach(() => {
    process.env.FEATURE_MY_ENABLED_FEATURE = 'true';
    process.env.FEATURE_MY_DISABLED_FEATURE = '';
    Features.Flags.FEATURE_MY_ENABLED_FEATURE = 'FEATURE_MY_ENABLED_FEATURE';
    Features.Flags.FEATURE_MY_DISABLED_FEATURE = 'FEATURE_MY_DISABLED_FEATURE';
  });

  afterEach(() => {
    delete Features.Flags.FEATURE_MY_ENABLED_FEATURE;
    delete Features.Flags.FEATURE_MY_DISABLED_FEATURE;
    delete process.env.FEATURE_MY_ENABLED_FEATURE;
    delete process.env.FEATURE_MY_DISABLED_FEATURE;
  });

  describe('.enabled', () => {
    context('when the flag exists and is truthy', () => {
      it('returns true', () => {
        const result = Features.enabled(Features.Flags.FEATURE_MY_ENABLED_FEATURE);

        expect(result).to.be.true;
      });
    });

    context('when the flag exists and is NOT truthy', () => {
      it('returns false', () => {
        const result = Features.enabled(Features.Flags.FEATURE_MY_DISABLED_FEATURE);

        expect(result).to.be.false;
      });
    });

    context('when the flag does not exist', () => {
      it('throws a UnknownFeatureFlagError', () => {
        const fn = () => Features.enabled('FOOBAR');
        expect(fn).to.throw(Features.UnknownFeatureFlagError);
      });
    });
  });
});
