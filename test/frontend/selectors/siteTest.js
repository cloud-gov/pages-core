import { expect } from 'chai';
import { currentSite } from '../../../frontend/selectors/site';

describe('siteSelectors', () => {
  describe('.currentSite', () => {
    const state = {
      data: [
        { id: 2 },
        { id: 3 },
      ],
    };

    it('returns the site for the given id', () => {
      const site = currentSite(state, '3');
      expect(site).to.eq(state.data[1]);
    });

    it('returns the null if there is not site for the given id', () => {
      const site = currentSite(state, '4');
      expect(site).to.be.undefined;
    });
  });
});
