import { expect } from 'chai';
import {
  sitesFetchStarted,
  sitesFetchStartedType,
  sitesReceived,
  sitesReceivedType,
  siteAdded,
  siteAddedType,
  siteUpdated,
  siteUpdatedType,
  siteDeleted,
  siteDeletedType,
  siteUserAdded,
  siteUserAddedType,
  siteUserRemoved,
  siteUserRemovedType,
  siteBasicAuthSaved,
  siteBasicAuthSavedType,
  siteBasicAuthRemoved,
  siteBasicAuthRemovedType,
} from '../../../../frontend/actions/actionCreators/siteActions';

describe('siteActions actionCreators', () => {
  describe('sitesFetchStarted', () => {
    it('constructs properly', () => {
      const actual = sitesFetchStarted();
      expect(actual).to.deep.equal({
        type: sitesFetchStartedType,
      });
    });

    it('exports its type', () => {
      expect(sitesFetchStartedType).to.equal('SITES_FETCH_STARTED');
    });
  });

  describe('sitesReceived', () => {
    it('constructs properly', () => {
      const sites = [
        {
          something: 'here',
        },
      ];

      const actual = sitesReceived(sites);

      expect(actual).to.deep.equal({
        type: sitesReceivedType,
        sites,
      });
    });

    it('exports its type', () => {
      expect(sitesReceivedType).to.equal('SITES_RECEIVED');
    });
  });

  describe('siteAdded', () => {
    it('constructs properly', () => {
      const site = {
        something: 'here',
      };

      const actual = siteAdded(site);

      expect(actual).to.deep.equal({
        type: siteAddedType,
        site,
      });
    });

    it('exports its type', () => {
      expect(siteAddedType).to.equal('SITE_ADDED');
    });
  });

  describe('siteUpdated', () => {
    it('constructs properly', () => {
      const id = 'tk421';
      const site = {
        something: 'here',
        id,
      };

      const actual = siteUpdated(site);

      expect(actual).to.deep.equal({
        type: siteUpdatedType,
        siteId: id,
        site,
      });
    });

    it('exports its type', () => {
      expect(siteUpdatedType).to.equal('SITE_UPDATED');
    });
  });

  describe('siteDeleted', () => {
    it('constructs properly', () => {
      const siteId = 'tk421';

      const actual = siteDeleted(siteId);

      expect(actual).to.deep.equal({
        type: siteDeletedType,
        siteId,
      });
    });

    it('exports its type', () => {
      expect(siteDeletedType).to.equal('SITE_DELETED');
    });
  });

  describe('siteUserAdded', () => {
    it('constructs properly', () => {
      const site = {
        id: 123,
        owner: 'owner',
        repository: 'a-repo',
      };

      const action = siteUserAdded(site);
      expect(action.type).to.equal(siteUserAddedType);
      expect(action.site).to.equal(site);
    });

    it('exports its type', () => {
      expect(siteUserAddedType).to.equal('SITE_USER_ADDED');
    });
  });

  describe('siteUserRemoved', () => {
    it('constructs properly', () => {
      const site = {
        id: 1,
        owner: 'someone',
        repository: 'something',
      };
      const action = siteUserRemoved(site);
      expect(action.type).to.equal(siteUserRemovedType);
      expect(action.site).to.equal(site);
    });
  });

  describe('basicAuthSaved', () => {
    it('constructs properly', () => {
      const site = {
        id: 1,
        owner: 'someone',
        repository: 'something',
      };
      const basicAuth = {
        username: 'username',
        password: 'password',
      };

      const actual = siteBasicAuthSaved(site, basicAuth);
      expect(actual).to.deep.equal({
        type: siteBasicAuthSavedType,
        siteId: site.id,
        site,
      });
    });
  });

  describe('basicAuthRemoved', () => {
    it('constructs properly', () => {
      const site = {
        id: 1,
        owner: 'someone',
        repository: 'something',
      };

      const actual = siteBasicAuthRemoved(site);

      expect(actual).to.deep.equal({
        type: siteBasicAuthRemovedType,
        siteId: site.id,
        site,
      });
    });
  });
});
