import { expect } from 'chai';
import {
  getOrgById,
  getOrgData,
  hasOrgs,
  orgFilterOptions,
} from '../../../frontend/selectors/organization';

describe('organzizationSelectors', () => {
  const state = {
    data: [
      {
        id: 1,
        name: 'org-1',
      },
      {
        id: 2,
        name: 'org-2',
      },
    ],
  };

  describe('.getOrgById', () => {
    it('returns the org for the given id', () => {
      const site = getOrgById(state, '2');
      expect(site).to.eq(state.data[1]);
    });

    it('returns the null if there is not an organization for the given id', () => {
      const site = getOrgById(state, '4');
      expect(site).to.be.undefined;
    });
  });

  describe('.getOrgData', () => {
    it('returns the organizations data', () => {
      const data = getOrgData(state);
      expect(data).to.eq(state.data);
    });

    it('returns the null if there are no organizations in the data array', () => {
      const orglessState = {
        data: [],
      };
      const data = getOrgData(orglessState);
      expect(data).to.be.null;
    });

    it('returns the null if there are no organizations in the data array', () => {
      const orglessState = {};
      const data = getOrgData(orglessState);
      expect(data).to.be.null;
    });
  });

  describe('.hasOrgs', () => {
    it('returns true if organizations array has items', () => {
      expect(hasOrgs(state)).to.be.true;
    });

    it('returns false if organizations data is an empty array', () => {
      const noOrgState = {
        data: [],
      };
      expect(hasOrgs(noOrgState)).to.be.false;
    });

    it('returns false if organizations data is undefined', () => {
      const noOrgState = {};
      expect(hasOrgs(noOrgState)).to.be.false;
    });
  });

  describe('.orgFilterOptions', () => {
    it('returns array of objects with id and name while adding the "All" and "Unassociated" options', () => {
      const grouped = orgFilterOptions(state);
      expect(grouped[0]).to.deep.equal({
        id: 'all-options',
        name: 'All',
      });
      expect(grouped[grouped.length - 1]).to.deep.equal({
        id: 'unassociated',
        name: 'Sites without an organization',
      });
      grouped.map((group) => expect(group).to.have.keys(['id', 'name']));
    });

    it('returns null if there is not organizations', () => {
      const noOrganizations = {};
      const grouped = orgFilterOptions(noOrganizations);
      expect(grouped).to.be.null;
    });
  });
});
