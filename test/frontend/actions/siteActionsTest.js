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
  let saveBasicAuthToSite;
  let removeBasicAuthFromSite;
  let httpErrorAlertAction;
  let alertSuccess;
  let alertError;
  let dispatchSitesFetchStartedAction;
  let dispatchSitesReceivedAction;
  let dispatchSiteAddedAction;
  let dispatchSiteUpdatedAction;
  let dispatchSiteDeletedAction;
  let dispatchSiteBranchesReceivedAction;
  let dispatchShowAddNewSiteFieldsAction;
  let dispatchHideAddNewSiteFieldsAction;
  let dispatchUserAddedToSiteAction;
  let dispatchUserRemovedFromSiteAction;
  let dispatchSiteBasicAuthRemovedAction;
  let dispatchSiteBasicAuthSavedAction;
  let dispatchResetFormAction;
  let reset;
  let fetchUser;
  const scrollTo = stub();

  const siteId = 'kuaw8fsru8hwugfw';
  const site = {
    id: siteId,
    could: 'be anything',
  };

  const errorMessage = 'it failed.';
  const error = {
    message: errorMessage,
  };

  before(() => {
    global.window.scrollTo = scrollTo;
  });

  after(() => {
    global.window.scrollTo = undefined;
  });

  beforeEach(() => {
    httpErrorAlertAction = spy();
    fetchSites = stub();
    addSite = stub();
    addUserToSite = stub();
    removeUserFromSite = stub();
    updateSite = stub();
    deleteSite = stub();
    saveBasicAuthToSite = stub();
    removeBasicAuthFromSite = stub();
    fetchBranches = stub();
    alertSuccess = stub();
    alertError = stub();
    dispatchSitesFetchStartedAction = stub();
    dispatchSitesReceivedAction = stub();
    dispatchSiteAddedAction = stub();
    dispatchSiteUpdatedAction = stub();
    dispatchSiteDeletedAction = stub();
    dispatchSiteBranchesReceivedAction = stub();
    dispatchShowAddNewSiteFieldsAction = stub();
    dispatchHideAddNewSiteFieldsAction = stub();
    dispatchUserAddedToSiteAction = stub();
    dispatchUserRemovedFromSiteAction = stub();
    dispatchSiteBasicAuthRemovedAction = stub();
    dispatchSiteBasicAuthSavedAction = stub();
    dispatchResetFormAction = stub();
    fetchUser = stub();
    reset = stub();

    fixture = proxyquire('../../../frontend/actions/siteActions', {
      './dispatchActions': {
        dispatchSitesFetchStartedAction,
        dispatchSitesReceivedAction,
        dispatchSiteAddedAction,
        dispatchSiteUpdatedAction,
        dispatchSiteDeletedAction,
        dispatchSiteBranchesReceivedAction,
        dispatchShowAddNewSiteFieldsAction,
        dispatchHideAddNewSiteFieldsAction,
        dispatchUserAddedToSiteAction,
        dispatchUserRemovedFromSiteAction,
        dispatchSiteBasicAuthRemovedAction,
        dispatchSiteBasicAuthSavedAction,
        dispatchResetFormAction,
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
        saveBasicAuthToSite,
        removeBasicAuthFromSite,
      },
      '../util/githubApi': {
        fetchBranches,
      },
      './userActions': {
        fetchUser,
      },
      'redux-form': {
        reset,
      },
    }).default;
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
      fetchSites.withArgs().rejects(error);

      const actual = fixture.fetchSites();

      return actual.then(() => {
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
      });
    });
  });

  describe('addSite', () => {
    const siteToAdd = {
      hey: 'you',
    };

    it('dispatches site added action to the store when successful', () => {
      addSite.withArgs(siteToAdd).resolves(site);

      const actual = fixture.addSite(siteToAdd);

      return actual.then(() => {
        expect(dispatchSiteAddedAction.calledWith(site)).to.be.true;
      });
    });

    it('behaves as a no-op when a site isnt added, but there is no error', () => {
      // addSite returns nothing when the POST request fails,
      // so resolve to nothing
      addSite.withArgs(siteToAdd).resolves();

      const actual = fixture.addSite(siteToAdd);

      return actual.then(() => {
        expect(dispatchSiteAddedAction.called).to.be.false;
      });
    });

    it('triggers an error and resets the add site form when a thrown error is caught', () => {
      addSite.withArgs(siteToAdd).rejects(error);

      const actual = fixture.addSite(siteToAdd);

      return actual.catch(() => {
        expect(dispatchHideAddNewSiteFieldsAction.called).to.be.true;
        expect(dispatchResetFormAction.called).to.be.true;
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
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
      updateSite.withArgs(siteToUpdate, data).resolves(site);

      const actual = fixture.updateSite(siteToUpdate, data);

      return actual.then(() => {
        expect(dispatchSiteUpdatedAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers an error when updating a site fails', () => {
      updateSite.withArgs(siteToUpdate, data).rejects(error);

      const actual = fixture.updateSite(siteToUpdate, data);

      return actual.then(() => {
        expect(scrollTo.called).to.be.true;
        expect(scrollTo.getCall(0).args).to.deep.equal([0, 0]);
        expect(dispatchSiteUpdatedAction.called).to.be.false;
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
      });
    });
  });

  describe('deleteSite', () => {
    it('triggers the deletion of a site and dispatches a site deleted action to the store when successful', () => {
      const siteToDelete = {
        completely: 'ignored',
      };
      deleteSite.withArgs(siteId).resolves(siteToDelete);
      fetchSites.resolves();

      const actual = fixture.deleteSite(siteId);

      return actual.then(() => {
        expect(dispatchSiteDeletedAction.calledWith(siteId)).to.be.true;
      });
    });

    it('triggers an error when deleting a site fails', () => {
      deleteSite.withArgs(siteId).rejects(error);

      const actual = fixture.deleteSite(siteId);

      return actual.then(() => {
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
      });
    });
  });

  describe('addUserToSite', () => {
    const repoToAdd = {
      owner: 'owner',
      repository: 'a-repo',
    };

    it('triggers adding adding the current user to the site represented by owner/repository', () => {
      addUserToSite.withArgs(repoToAdd).resolves(site);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(dispatchUserAddedToSiteAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers showing additional add site fields when adding the user fails with 404', () => {
      const rejectWith404Error = {
        response: {
          status: 404,
        },
        message: 'Not found',
      };

      addUserToSite.withArgs(repoToAdd).rejects(rejectWith404Error);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(dispatchShowAddNewSiteFieldsAction.calledOnce).to.be.true;
      });
    });

    it('triggers an http alert error, and resets the form when adding the user fails with other than 404', () => {
      addUserToSite.withArgs(repoToAdd).rejects(error);

      const actual = fixture.addUserToSite(repoToAdd);

      return actual.then(() => {
        expect(dispatchHideAddNewSiteFieldsAction.called).to.be.true;
        expect(dispatchResetFormAction.called).to.be.true;
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
      });
    });
  });

  describe('.removeUserFromSite', () => {
    it('triggers an http success alert when user is removed, and refetches user + site data', () => {
      removeUserFromSite.withArgs(1, 1).resolves({});
      fetchSites.resolves();
      fetchUser.resolves();
      const actual = fixture.removeUserFromSite(1, 1);
      return actual.then(() => {
        expect(fetchSites.called).to.be.true;
        expect(fetchUser.called).to.be.true;
        expect(alertSuccess.called).to.be.true;
        expect(alertSuccess.calledWith('Successfully removed.')).to.be.true;
        expect(dispatchUserRemovedFromSiteAction.called).to.be.true;
      });
    });

    it('triggers alertSuccess and dispatches user removed from site when a user removes themselves', () => {
      removeUserFromSite.withArgs(1, 1).resolves({});
      fetchSites.resolves();
      const actual = fixture.removeUserFromSite(1, 1, true);
      return actual.then(() => {
        expect(fetchUser.called).to.be.true;
        expect(fetchSites.called).to.be.true;
        expect(alertSuccess.called).to.be.true;
        expect(alertSuccess.calledWith('Successfully removed.')).to.be.true;
        expect(dispatchUserRemovedFromSiteAction.called).to.be.true;
      });
    });
  });

  describe('addBasicAuthToSite', () => {
    const basicAuth = {
      username: 'username',
      password: 'password',
    };

    it('triggers the updating of a site and dispatches a site updated action to the store when successful', () => {
      const basicAuthSite = {
        ...site,
        config: { basicAuth },
      };
      const sitePromise = Promise.resolve(basicAuthSite);
      saveBasicAuthToSite.withArgs(siteId, basicAuth).returns(sitePromise);

      const actual = fixture.saveBasicAuthToSite(siteId, basicAuth);

      return actual.then(() => {
        expect(dispatchSiteBasicAuthSavedAction.calledWith(basicAuthSite)).to.be.true;
      });
    });

    it('triggers an error when updating a site fails', () => {
      saveBasicAuthToSite.withArgs(siteId, basicAuth).rejects(error);

      const actual = fixture.saveBasicAuthToSite(siteId, basicAuth);

      return actual.then(() => {
        expect(scrollTo.called).to.be.true;
        expect(scrollTo.getCall(0).args).to.deep.equal([0, 0]);
        expect(dispatchSiteBasicAuthSavedAction.called).to.be.false;
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
      });
    });
  });

  describe('removeBasicAuthFromSite', () => {
    it('triggers the updating of a site and dispatches a site updated action to the store when successful', () => {
      // const basicAuthSite = {...site, config: { basicAuth } }
      const sitePromise = Promise.resolve(site);
      removeBasicAuthFromSite.withArgs(siteId).returns(sitePromise);

      const actual = fixture.removeBasicAuthFromSite(siteId);

      return actual.then(() => {
        expect(dispatchSiteBasicAuthRemovedAction.calledWith(site)).to.be.true;
      });
    });

    it('triggers an error when updating a site fails', () => {
      removeBasicAuthFromSite.withArgs(siteId).rejects(error);

      const actual = fixture.removeBasicAuthFromSite(siteId);

      return actual.then(() => {
        expect(scrollTo.called).to.be.true;
        expect(scrollTo.getCall(0).args).to.deep.equal([0, 0]);
        expect(dispatchSiteBasicAuthRemovedAction.called).to.be.false;
        expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
      });
    });
  });
});
