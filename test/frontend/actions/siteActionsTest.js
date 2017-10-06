import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('siteActions', () => {
  let fixture;

  let fetchBranches;

  let fetchSites;
  let addSite;
  let addUserToSite;
  let updateSite;
  let deleteSite;
  let httpErrorAlertAction;
  let alertSuccess;
  let alertError;
  let updateRouterToSitesUri;
  let dispatchSitesFetchStartedAction;
  let dispatchSitesReceivedAction;
  let dispatchSiteAddedAction;
  let dispatchSiteUpdatedAction;
  let dispatchSiteDeletedAction;
  let dispatchSiteBranchesReceivedAction;
  let dispatchShowAddNewSiteFieldsAction;
  let dispatchUserAddedToSiteAction;

  const siteId = 'kuaw8fsru8hwugfw';
  const site = {
    id: siteId,
    could: 'be anything',
  };

  const errorMessage = 'it failed.';
  const error = {
    message: errorMessage,
  };
  const rejectedWithErrorPromise = Promise.reject(error);

  beforeEach(() => {
    httpErrorAlertAction = spy();
    fetchSites = stub();
    addSite = stub();
    addUserToSite = stub();
    updateSite = stub();
    deleteSite = stub();
    fetchBranches = stub();
    alertSuccess = stub();
    alertError = stub();

    updateRouterToSitesUri = stub();
    dispatchSitesFetchStartedAction = stub();
    dispatchSitesReceivedAction = stub();
    dispatchSiteAddedAction = stub();
    dispatchSiteUpdatedAction = stub();
    dispatchSiteDeletedAction = stub();
    dispatchSiteBranchesReceivedAction = stub();
    dispatchShowAddNewSiteFieldsAction = stub();
    dispatchUserAddedToSiteAction = stub();

    fixture = proxyquire('../../../frontend/actions/siteActions', {
      './dispatchActions': {
        updateRouterToSitesUri,
        dispatchSitesFetchStartedAction,
        dispatchSitesReceivedAction,
        dispatchSiteAddedAction,
        dispatchSiteUpdatedAction,
        dispatchSiteDeletedAction,
        dispatchSiteBranchesReceivedAction,
        dispatchShowAddNewSiteFieldsAction,
        dispatchUserAddedToSiteAction,
      },
      './alertActions': {
        httpError: httpErrorAlertAction,
        alertSuccess,
        alertError,
      },
      '../util/federalistApi': {
        fetchSites,
        addSite,
        updateSite,
        deleteSite,
        addUserToSite,
      },
      '../util/githubApi': {
        fetchBranches,
      },
    }).default;
  });

  const expectDispatchOfHttpErrorAlert = (errMsg) => {
    expect(httpErrorAlertAction.calledWith(errMsg)).to.be.true;
  };

  const validateResultDispatchesHttpAlertError = (promise, errMsg) => promise.then(() => {
    expectDispatchOfHttpErrorAlert(errMsg);
  });


  describe('fetchSites', () => {
    it('triggers the fetching of sites and dispatches a sites received action to the store when successful', () => {
      const sites = {
        hi: 'mom',
      };
      const sitesPromise = Promise.resolve(sites);
      fetchSites.withArgs().returns(sitesPromise);

      const actual = fixture.fetchSites();

      return actual.then(() => {
        expect(dispatchSitesFetchStartedAction.called).to.be.true;
        expect(dispatchSitesReceivedAction.calledWith(sites)).to.be.true;
      });
    });

    it('triggers an error when fetching of sites fails', () => {
      fetchSites.withArgs().returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSites();

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe('addSite', () => {
    it('triggers the adding of a site and dispatches site added and update router actions to the store when successful', () => {
      const siteToAdd = {
        hey: 'you',
      };
      const sitePromise = Promise.resolve(site);
      addSite.withArgs(siteToAdd).returns(sitePromise);

      const actual = fixture.addSite(siteToAdd);

      return actual.then(() => {
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
        expect(dispatchSiteAddedAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers an error when adding a site fails', () => {
      const siteToAdd = {
        hey: 'you',
      };
      addSite.withArgs(siteToAdd).returns(rejectedWithErrorPromise);

      const actual = fixture.addSite(siteToAdd);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe('updateSite', () => {
    it('triggers the updating of a site and dispatches a site updated action to the store when successful', () => {
      const siteToUpdate = {
        hi: 'pal',
      };
      const data = {
        who: 'knows',
      };
      const sitePromise = Promise.resolve(site);
      updateSite.withArgs(siteToUpdate, data).returns(sitePromise);

      const actual = fixture.updateSite(siteToUpdate, data);

      return actual.then(() => {
        expect(dispatchSiteUpdatedAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers an error when updating a site fails', () => {
      const siteToUpdate = {
        hi: 'pal',
      };
      const data = {
        who: 'knows',
      };
      updateSite.withArgs(siteToUpdate, data).returns(rejectedWithErrorPromise);

      const actual = fixture.updateSite(siteToUpdate, data);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe('deleteSite', () => {
    it('triggers the deletion of a site and dispatches a site deleted update router actions to the store when successful', () => {
      const siteToDelete = {
        completely: 'ignored',
      };
      const sitePromise = Promise.resolve(siteToDelete);
      deleteSite.withArgs(siteId).returns(sitePromise);

      const actual = fixture.deleteSite(siteId);

      return actual.then(() => {
        expect(dispatchSiteDeletedAction.calledWith(siteId)).to.be.true;
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
      });
    });

    it('triggers an error when deleting a site fails', () => {
      deleteSite.withArgs(siteId).returns(rejectedWithErrorPromise);

      const actual = fixture.deleteSite(siteId);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe('addUserToSite', () => {
    it('triggers adding adding the current user to the site represented by owner/repository', () => {
      const repoToAdd = {
        owner: 'owner',
        repository: 'a-repo',
      };
      const sitePromise = Promise.resolve(site);
      addUserToSite.withArgs(repoToAdd).returns(sitePromise);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
        expect(dispatchUserAddedToSiteAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers showing additional add site fields when adding the user fails', () => {
      const repoToAdd = {
        owner: 'owner',
        repository: 'a-repo',
      };
      addUserToSite.withArgs(repoToAdd).returns(rejectedWithErrorPromise);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(dispatchShowAddNewSiteFieldsAction.calledOnce).to.be.true;
      });
    });
  });
});
