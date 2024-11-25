import { expect } from 'chai';
import { currentSite, groupSitesByOrg } from '../../../frontend/selectors/site';

describe('siteSelectors', () => {
  describe('.currentSite', () => {
    const state = {
      data: [{ id: 2 }, { id: 3 }],
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
      isLoading: true,
      data: [
        {
          id: 1,
          organizationId: 1,
        },
        {
          id: 2,
          organizationId: 1,
        },
        {
          id: 3,
          organizationId: 2,
        },
        { id: 4 },
      ],
    };

    it('returns object indexed by org name and groups org-less sites as "undefined"', () => {
      const orgId = 1;
      const grouped = groupSitesByOrg(sites, orgId);
      expect(grouped.data).to.have.length(2);
      grouped.data.map((group) => expect(group.organizationId).to.equal(orgId));
    });

    it('returns all sites with organization Id equals "all-options"', () => {
      const orgId = 'all-options';
      const grouped = groupSitesByOrg(sites, orgId);
      expect(grouped.data).to.deep.equal(sites.data);
    });

    it('returns an sites data as an empty array with organization Id is not associated to any sites', () => {
      const orgId = 100;
      const grouped = groupSitesByOrg(sites, orgId);
      expect(grouped.data).to.deep.equal([]);
    });
  });
});
