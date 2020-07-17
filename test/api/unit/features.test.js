const { expect } = require('chai');
const Features = require('../../../api/features');

beforeEach(() => {
  process.env.FEATURE_MY_AWESOME_FEATURE = 'true';
  process.env.FEATURE_MY_TERRIBLE_FEATURE = '';
  Features.FLAGS.MY_AWESOME_FEATURE = 'MY_AWESOME_FEATURE';
  Features.FLAGS.MY_TERRIBLE_FEATURE = 'MY_TERRIBLE_FEATURE';
});

afterEach(() => {
  delete Features.FLAGS.MY_AWESOME_FEATURE;
  delete Features.FLAGS.MY_TERRIBLE_FEATURE;
  delete process.env.FEATURE_MY_AWESOME_FEATURE;
  delete process.env.FEATURE_MY_TERRIBLE_FEATURE;
});

describe.only('.enabled', () => {
  context('when the flag exists and is truthy', () => {
    it('returns true', () => {
      const result = Features.enabled(Features.FLAGS.MY_AWESOME_FEATURE);

      expect(result).to.be.true;
    });
  });

  context('when the flag exists and is NOT truthy', () => {
    it('returns true', () => {
      const result = Features.enabled(Features.FLAGS.MY_TERRIBLE_FEATURE);

      expect(result).to.be.true;
    });
  });

  context('when the flag does not exist', () => {
    it('throws a UnknownFeatureFlagError', () => {
      const fn = () => Features.enabled('FOOBAR');
      expect(fn).to.throw(Features.UnknownFeatureFlagError);
    });
  });
});
