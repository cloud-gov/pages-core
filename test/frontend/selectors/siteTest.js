import { expect } from 'chai';
import { currentSite, groupSitesByOrg } from '../../../frontend/selectors/site';

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

  describe('.groupSitesByOrg', () => {
    const sites = {
      data: [
        { id: 1, organization: 'org-1' },
        { id: 2, organization: 'org-2' },
        { id: 3 },
      ],
    };

    it('returns object indexed by org name and groups org-less sites as "undefined"', () => {
      const keys = ['org-1', 'org-2', 'unassociated'];
      const organizations = {
        data: [
          { name: 'org-1' },
          { name: 'org-2' },
        ],
      };
      const grouped = groupSitesByOrg(sites, organizations);
      expect(grouped).to.have.keys(keys);
      keys.map(key => expect(grouped[key].length).to.equal(1));
    });

    it('returns object indexed by org name with empty areas when no site organizations match', () => {
      const keys = ['org-1', 'org-2', 'unassociated', 'other-org'];
      const organizations = {
        data: [
          { name: 'org-1' },
          { name: 'org-2' },
          { name: 'other-org' },
        ],
      };
      const grouped = groupSitesByOrg(sites, organizations);
      expect(grouped).to.have.keys(keys);
      expect(grouped['other-org']).to.have.length(0);
    });
  });
});
