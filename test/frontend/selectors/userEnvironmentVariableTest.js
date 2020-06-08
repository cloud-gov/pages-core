import { expect } from 'chai';
import { siteUserEnvironmentVariables } from '../../../frontend/selectors/userEnvironmentVariable';

describe('userEnvironmentVariableSelectors', () => {
  describe('.siteUserEnvironmentVariables', () => {
    const state = {
      1: {
        foo: 'bar',
      },
      2: {
        foo: 'bar',
      },
    };

    it('returns the uevs for the given site id', () => {
      const siteId = 1;

      const result = siteUserEnvironmentVariables(state, siteId);

      expect(result).to.eq(state[siteId]);
    });

    it('returns a default value if there is no value for the given site id', () => {
      const siteId = 3;

      const result = siteUserEnvironmentVariables(state, siteId);

      expect(result).to.deep.equal({
        isLoading: false,
        data: [],
      });
    });
  });
});
