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
  let removeUserFromSite;
  let updateSite;
  let deleteSite;
  let httpErrorAlertAction;
  let alertSuccess;
  let alertError;
  let updateRouterToSitesUri;
  let updateRouterToSiteBuildsUri;
  let dispatchSitesFetchStartedAction;
  let dispatchSitesReceivedAction;
  let dispatchSiteAddedAction;
  let dispatchSiteUpdatedAction;
  let dispatchSiteDeletedAction;
  let dispatchSiteBranchesReceivedAction;
  let dispatchShowAddNewSiteFieldsAction;
  let dispatchUserAddedToSiteAction;
  let dispatchUserRemovedFromSiteAction;
  let fetchUser;

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
    removeUserFromSite = stub();
    updateSite = stub();
    deleteSite = stub();
    fetchBranches = stub();
    alertSuccess = stub();
    alertError = stub();
    updateRouterToSitesUri = stub();
    updateRouterToSiteBuildsUri = stub();
    dispatchSitesFetchStartedAction = stub();
    dispatchSitesReceivedAction = stub();
    dispatchSiteAddedAction = stub();
    dispatchSiteUpdatedAction = stub();
    dispatchSiteDeletedAction = stub();
    dispatchSiteBranchesReceivedAction = stub();
    dispatchShowAddNewSiteFieldsAction = stub();
    dispatchUserAddedToSiteAction = stub();
    dispatchUserRemovedFromSiteAction = stub();
    fetchUser = stub();

    fixture = proxyquire('../../../frontend/actions/siteActions', {
      './dispatchActions': {
        updateRouterToSitesUri,
        updateRouterToSiteBuildsUri,
        dispatchSitesFetchStartedAction,
        dispatchSitesReceivedAction,
        dispatchSiteAddedAction,
        dispatchSiteUpdatedAction,
        dispatchSiteDeletedAction,
        dispatchSiteBranchesReceivedAction,
        dispatchShowAddNewSiteFieldsAction,
        dispatchUserAddedToSiteAction,
        dispatchUserRemovedFromSiteAction,
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
        removeUserFromSite,
      },
      '../util/githubApi': {
        fetchBranches,
      },
      './userActions': {
        fetchUser,
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
    const siteToAdd = {
      hey: 'you',
    };

    it('triggers the adding of a site and dispatches site added and update router actions to the store when successful', () => {
      const sitePromise = Promise.resolve(site);
      addSite.withArgs(siteToAdd).returns(sitePromise);

      const actual = fixture.addSite(siteToAdd);

      return actual.then(() => {
        expect(updateRouterToSiteBuildsUri.calledOnce).to.be.true;
        expect(dispatchSiteAddedAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers an error and triggers a router update to the site list page when adding a site fails', () => {
      // addSite returns nothing when the POST request fails,
      // so resolve to nothing
      addSite.withArgs(siteToAdd).returns(Promise.resolve());

      const actual = fixture.addSite(siteToAdd);

      return actual.then(() => {
        expect(dispatchSiteAddedAction.called).to.be.false;
        expect(updateRouterToSiteBuildsUri.called).to.be.false;
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
        validateResultDispatchesHttpAlertError(actual, errorMessage);
      });
    });
  });

  describe('updateSite', () => {
    const siteToUpdate = {
      hi: 'pal',
    };
    const data = {
      who: 'knows',
    };

    it('triggers the updating of a site and dispatches a site updated action to the store when successful', () => {
      const sitePromise = Promise.resolve(site);
      updateSite.withArgs(siteToUpdate, data).returns(sitePromise);

      const actual = fixture.updateSite(siteToUpdate, data);

      return actual.then(() => {
        expect(dispatchSiteUpdatedAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers an error when updating a site fails', () => {
      updateSite.withArgs(siteToUpdate, data).returns(rejectedWithErrorPromise);

      const actual = fixture.updateSite(siteToUpdate, data);

      return actual.then(() => {
        expect(dispatchSiteUpdatedAction.called).to.be.false;
        validateResultDispatchesHttpAlertError(actual, errorMessage);
      });
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
    const repoToAdd = {
      owner: 'owner',
      repository: 'a-repo',
    };

    it('triggers adding adding the current user to the site represented by owner/repository', () => {
      const sitePromise = Promise.resolve(site);
      addUserToSite.withArgs(repoToAdd).returns(sitePromise);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
        expect(dispatchUserAddedToSiteAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers showing additional add site fields when adding the user fails with 404', () => {
      const rejectWith404Error = Promise.reject({
        response: { status: 404 },
        message: 'Not found',
      });

      addUserToSite.withArgs(repoToAdd).returns(rejectWith404Error);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(dispatchShowAddNewSiteFieldsAction.calledOnce).to.be.true;
      });
    });

    it('triggers an http alert error when adding the user fails with other than 404', () => {
      addUserToSite.withArgs(repoToAdd).returns(rejectedWithErrorPromise);

      const actual = fixture.addUserToSite(repoToAdd);
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe('.removeUserFromSite', () => {
    it('triggers an http success alert when user is removed, and refetches user data', () => {
      removeUserFromSite.withArgs(1, 1).returns(Promise.resolve({}));
      const actual = fixture.removeUserFromSite(1, 1);
      actual.then(() => {
        expect(fetchSites.called).to.be.true;
        expect(fetchUser.called).to.be.true;
        expect(updateRouterToSitesUri.called).to.be.false;
        expect(alertSuccess.called).to.be.true;
        expect(dispatchUserRemovedFromSiteAction.called).to.be.true;
      });
    });

    it('triggers a redirect to the sites page when a user removes themselves', () => {
      removeUserFromSite.withArgs(1, 1).returns(Promise.resolve({}));
      const actual = fixture.removeUserFromSite(1, 1, true);
      actual.then(() => {
        expect(updateRouterToSitesUri.called).to.be.true;
        expect(fetchSites.called).to.be.true;
        expect(alertSuccess.called).to.be.true;
        expect(dispatchUserRemovedFromSiteAction.called).to.be.true;
      });
    });
  });
});
