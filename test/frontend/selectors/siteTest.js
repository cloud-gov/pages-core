import { expect } from 'chai';
import { currentSite } from '../../../frontend/selectors/site';

describe('siteSelectors', () => {
  describe('.currentSite', () => {
    it('returns the site for the given id', () => {
      const state = {
        data: [
          { id: 2 },
          { id: 3 },
        ],
      };

      const id = '3';

      const site = currentSite(state, id);

      expect(site).to.eq(state.data[1]);
    });

    it('returns the null if there is not site for the given id', () => {
      const state = {
        data: [
          { id: 2 },
          { id: 3 },
        ],
      };

      const id = '4';

      const site = currentSite(state, id);

      expect(site).to.be.undefined;
    });
  });
});
