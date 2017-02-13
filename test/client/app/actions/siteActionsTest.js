import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("siteActions", () => {
  let fixture;

  let fetchBranches, deleteBranch, createRepo, fetchFile, getRepo;

  let fetchSites, addSite, updateSite, deleteSite, siteExists;

  let httpErrorAlertAction, alertSuccess, alertError;

  let updateRouterToSitesUri, updateRouterToSpecificSiteUri, dispatchSitesReceivedAction,
      dispatchSiteAddedAction, dispatchSiteUpdatedAction, dispatchSiteDeletedAction,
      dispatchSiteBranchesReceivedAction, dispatchSiteInvalidAction,
      dispatchSiteLoadingAction;

  const siteId = "kuaw8fsru8hwugfw";
  const site = {
    id: siteId,
    could: "be anything"
  };

  const errorMessage = "it failed.";
  const error = {
    message: errorMessage
  };
  const rejectedWithErrorPromise = Promise.reject(error);

  beforeEach(() => {
    httpErrorAlertAction = spy();
    fetchSites = stub();
    addSite = stub();
    updateSite = stub();
    deleteSite = stub();
    getRepo = stub();
    fetchBranches = stub();
    deleteBranch = stub();
    createRepo = stub();
    alertSuccess = stub();
    alertError = stub();
    siteExists = stub();

    updateRouterToSitesUri = stub();
    updateRouterToSpecificSiteUri = stub();
    dispatchSitesReceivedAction = stub();
    dispatchSiteAddedAction = stub();
    dispatchSiteUpdatedAction = stub();
    dispatchSiteDeletedAction = stub();
    dispatchSiteBranchesReceivedAction = stub();
    dispatchSiteInvalidAction = stub();
    dispatchSiteLoadingAction = stub();

    fixture = proxyquire("../../../../assets/app/actions/siteActions", {
      "./dispatchActions": {
        updateRouterToSitesUri: updateRouterToSitesUri,
        updateRouterToSpecificSiteUri: updateRouterToSpecificSiteUri,
        dispatchSitesReceivedAction: dispatchSitesReceivedAction,
        dispatchSiteAddedAction: dispatchSiteAddedAction,
        dispatchSiteUpdatedAction: dispatchSiteUpdatedAction,
        dispatchSiteDeletedAction: dispatchSiteDeletedAction,
        dispatchSiteBranchesReceivedAction: dispatchSiteBranchesReceivedAction,
        dispatchSiteInvalidAction: dispatchSiteInvalidAction,
        dispatchSiteLoadingAction: dispatchSiteLoadingAction
      },
      "./alertActions": {
        httpError: httpErrorAlertAction,
        alertSuccess: alertSuccess,
        alertError: alertError
      },
      "../util/federalistApi": {
        fetchSites: fetchSites,
        addSite: addSite,
        updateSite: updateSite,
        deleteSite: deleteSite
      },
      "../util/githubApi": {
        fetchBranches: fetchBranches,
        createRepo: createRepo,
        getRepo: getRepo
      },
    }).default;
  });

  describe("fetchSites", () => {
    it("triggers the fetching of sites and dispatches a sites received action to the store when successful", () => {
      const action = {
        hi: "you"
      };
      const sites = {
        hi: "mom"
      };
      const sitesPromise = Promise.resolve(sites);
      fetchSites.withArgs().returns(sitesPromise);

      const actual = fixture.fetchSites();

      return actual.then(() => {
        expect(dispatchSitesReceivedAction.calledWith(sites)).to.be.true;
      });
    });

    it("triggers an error when fetching of sites fails", () => {
      fetchSites.withArgs().returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSites();

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("addSite", () => {
    it("triggers the adding of a site and dispatches site added and update router actions to the store when successful", () => {
      const siteToAdd = {
        hey: "you"
      };
      const sitePromise = Promise.resolve(site);
      addSite.withArgs(siteToAdd).returns(sitePromise);

      const actual = fixture.addSite(siteToAdd);

      return actual.then(() => {
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
        expect(dispatchSiteAddedAction.calledWith(site)).to.be.true;
      });
    });

    it("triggers an error when adding a site fails", () => {
      const siteToAdd = {
        hey: "you"
      };
      addSite.withArgs(siteToAdd).returns(rejectedWithErrorPromise);

      const actual = fixture.addSite(siteToAdd);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("updateSite", () => {
    it("triggers the updating of a site and dispatches a site updated action to the store when successful", () => {
      const siteToUpdate = {
        hi: "pal"
      };
      const data = {
        who: "knows"
      };
      const sitePromise = Promise.resolve(site);
      updateSite.withArgs(siteToUpdate, data).returns(sitePromise);

      const actual = fixture.updateSite(siteToUpdate, data);

      return actual.then(() => {
        expect(dispatchSiteUpdatedAction.calledWith(site)).to.be.true;
      });
    });

    it("triggers an error when updating a site fails", () => {
      const siteToUpdate = {
        hi: "pal"
      };
      const data = {
        who: "knows"
      };
      updateSite.withArgs(siteToUpdate, data).returns(rejectedWithErrorPromise);

      const actual = fixture.updateSite(siteToUpdate, data);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("deleteSite", () => {
    it("triggers the deletion of a site and dispatches a site deleted update router actions to the store when successful", () => {
      const site = {
        completely: "ignored"
      };
      const sitePromise = Promise.resolve(site);
      deleteSite.withArgs(siteId).returns(sitePromise);

      const actual = fixture.deleteSite(siteId);

      return actual.then(() => {
        expect(dispatchSiteDeletedAction.calledWith(siteId)).to.be.true;
        expect(updateRouterToSitesUri.calledOnce).to.be.true;
      });
    });

    it("triggers an error when deleting a site fails", () => {
      deleteSite.withArgs(siteId).returns(rejectedWithErrorPromise);

      const actual = fixture.deleteSite(siteId);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("fetch(Site)Branches", () => {
    it("fetches a site's branches and dispatches a site branches received action to the store when successful, returning the same site given", () => {
      const branches = {
        blurry: "vision",
        get: "glasses"
      };

      const branchesPromise = Promise.resolve(branches);
      fetchBranches.withArgs(site).returns(branchesPromise);

      const actual = fixture.fetchBranches(site);

      return actual.then((result) => {
        expect(dispatchSiteBranchesReceivedAction.calledWith(siteId, branches)).to.be.true;
        expect(result).to.equal(site);
      });
    });

    it("does nothing when fetching a site's branches fails", () => {
      fetchBranches.withArgs(site).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchBranches(site);

      expectDispatchToNotBeCalled(actual, dispatchSiteBranchesReceivedAction);
    });
  });

  describe("cloneRepo", () => {
    const destination = "destination";
    const source = "source";

    it("dispatches a site added action and redirects to a site uri if we successfully create and clone a repo", () => {
      const sitePromise = Promise.resolve(site);
      createRepo.withArgs(destination, source).returns(Promise.resolve("ignored"));
      addSite.withArgs(destination).returns(sitePromise);

      const actual = fixture.cloneRepo(destination, source);

      return actual.then(() => {
        expect(updateRouterToSpecificSiteUri.calledOnce).to.be.true;
        expect(dispatchSiteAddedAction.calledWith(site)).to.be.true;
      });
    });

    it("alerts an error if createRepo fails", () => {
      createRepo.withArgs(destination, source).returns(rejectedWithErrorPromise);

      const actual = fixture.cloneRepo(destination, source);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });

    it("alerts an error if addSite fails", () => {
      createRepo.withArgs(destination, source).returns(Promise.resolve("ignored"));
      addSite.withArgs(destination).returns(rejectedWithErrorPromise);

      const actual = fixture.cloneRepo(destination, source);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  const expectDispatchToNotBeCalled = (promise, dispatchFunction) => {
    promise.catch(() => {
      expect(dispatchFunction.called).to.be.false;
    });
  };

  const validateResultDispatchesHttpAlertError = (promise, errorMessage) => {
    return promise.then(() => {
      expectDispatchOfHttpErrorAlert(errorMessage);
    });
  };

  const expectDispatchOfHttpErrorAlert = errorMessage => {
    expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
  };

  const validateResultDispatchesAlertError = (promise, errorMessage) => {
    return promise.then(() => {
      expectDispatchOfErrorAlert(errorMessage);
    });
  };

  const expectDispatchOfErrorAlert = errorMessage => {
    expect(alertError.calledWith(errorMessage)).to.be.true;
  };

  const stubSuccessChain = methods => {
    methods.forEach((method) => {
      method.withArgs(site).returns(Promise.resolve());
    });
  };
});
