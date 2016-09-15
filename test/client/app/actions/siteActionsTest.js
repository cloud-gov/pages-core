import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("siteActions", () => {
  let fixture;
  let dispatch, httpErrorAlertAction, fetchSites, addSite, updateSite, deleteSite, fetchRepositoryContent,
      fetchRepositoryConfigs, createCommit, encodeB64, alertSuccess;
  let sitesReceivedActionCreator, siteAddedActionCreator, siteDeletedActionCreator,
      siteUpdatedActionCreator, siteFileContentReceivedActionCreator, siteAssetsReceivedActionCreator,
      siteFilesReceivedActionCreator,
      updateRouterActionCreator;
  const SITE_CONFIGS_RECEIVED = "my kingdom for a config!";
  
  beforeEach(() => {
    dispatch = spy();
    httpErrorAlertAction = spy();
    fetchSites = stub();
    addSite = stub();
    updateSite = stub();
    deleteSite = stub();
    fetchRepositoryContent = stub();
    fetchRepositoryConfigs = stub();
    createCommit = stub();
    encodeB64 = stub();
    alertSuccess = stub();
    sitesReceivedActionCreator = stub();
    updateRouterActionCreator = stub();
    siteAddedActionCreator = stub();
    siteUpdatedActionCreator = stub();
    siteDeletedActionCreator = stub();
    siteFileContentReceivedActionCreator = stub();
    siteAssetsReceivedActionCreator = stub();
    siteFilesReceivedActionCreator = stub();
    
    // FIXME: complex dependency wiring a smell
    fixture = proxyquire("../../../../assets/app/actions/siteActions", {
      "./actionCreators/siteActions": {
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
        siteFileContentReceived: siteFileContentReceivedActionCreator,
        siteAssetsReceived: siteAssetsReceivedActionCreator,
        siteFilesReceived: siteFilesReceivedActionCreator
      },
      "./actionCreators/navigationActions": {
        updateRouter: updateRouterActionCreator
      },
      "../constants": {
        siteActionTypes: {
          SITE_CONFIGS_RECEIVED: SITE_CONFIGS_RECEIVED
        }
      },
      "../store": {
        dispatch: dispatch
      },
      "./alertActions": {
        httpError: httpErrorAlertAction,
        alertSuccess: alertSuccess
      },
      "../util/federalistApi": {
        fetchSites: fetchSites,
        addSite: addSite,
        updateSite: updateSite,
        deleteSite: deleteSite
      },
      "../util/githubApi": {
        fetchRepositoryContent: fetchRepositoryContent,
        fetchRepositoryConfigs: fetchRepositoryConfigs,
        createCommit: createCommit
      },
      "../util/encoding": {
        encodeB64: encodeB64
      }
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
      sitesReceivedActionCreator.withArgs(sites).returns(action);

      const actual = fixture.fetchSites();
      
      return actual.then(() => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(action)).to.be.true;
      });
    });
    
    it("triggers an error when fetching of sites fails", () => {
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      fetchSites.withArgs().returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSites();
      
      return actual.then(() => {
        dispatchesAnAlertError(errorMessage);
      });
    });
  });

  describe("addSite", () => {
    it("triggers the adding of a site and dispatches site added and update router actions to the store when successful", () => {
      const siteToAdd = {
        hey: "you"
      };
      const site = {
        hi: "mom"
      };
      const sitePromise = Promise.resolve(site);
      const routerAction = {
        whatever: "bub"
      };
      const siteAddedAction = {
        action: "yep"
      };
      addSite.withArgs(siteToAdd).returns(sitePromise);
      updateRouterActionCreator.withArgs("/sites").returns(routerAction);
      siteAddedActionCreator.withArgs(site).returns(siteAddedAction);

      const actual = fixture.addSite(siteToAdd);
      
      return actual.then(() => {
        expect(dispatch.callCount).to.equal(2);
        
        expect(dispatch.calledWith(siteAddedAction)).to.be.true;
        expect(dispatch.calledWith(routerAction)).to.be.true;
      });
    });

    it("triggers an error when adding a site fails", () => {
      const siteToAdd = {
        hey: "you"
      };
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      addSite.withArgs(siteToAdd).returns(rejectedWithErrorPromise);

      const actual = fixture.addSite(siteToAdd);
      
      return actual.then(() => {
        dispatchesAnAlertError(errorMessage);
      });
    });
  });

  describe("updateSite", () => {
    it("triggers the updating of a site and dispatches a site updated action to the store when successful", () => {
      const id = "kuaw8fsru8hwugfw";
      const siteToUpdate = {
        hi: "pal"
      };
      const data = {
        who: "knows"
      };
      const site = {
        id: id,
        could: "be anything"
      };
      const siteUpdatedAction = {
        action: "wait, what's my queue?"
      };
      const sitePromise = Promise.resolve(site);
      updateSite.withArgs(siteToUpdate, data).returns(sitePromise);
      siteUpdatedActionCreator.withArgs(site).returns(siteUpdatedAction);
      
      const actual = fixture.updateSite(siteToUpdate, data);
      
      return actual.then(() => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteUpdatedAction)).to.be.true;
      });
    });

    it("triggers an error when updating a site fails", () => {
      const siteToUpdate = {
        hi: "pal"
      };
      const data = {
        who: "knows"
      };
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      updateSite.withArgs(siteToUpdate, data).returns(rejectedWithErrorPromise);

      const actual = fixture.updateSite(siteToUpdate, data);
      
      return actual.then(() => {
        dispatchesAnAlertError(errorMessage);
      });
    });
  });

  describe("deleteSite", () => {
    it("triggers the deletion of a site and dispatches a site deleted update router actions to the store when successful", () => {
      const siteId = "fohjf892unsfkgh3874t249ofmlsfjngu";
      const site = {
        completely: "ignored"
      };
      const sitePromise = Promise.resolve(site);
      const routerAction = {
        whatever: "bub"
      };
      const siteDeletedAction = {
        delete: "site action"
      };
      deleteSite.withArgs(siteId).returns(sitePromise);
      updateRouterActionCreator.withArgs("/sites").returns(routerAction);
      siteDeletedActionCreator.withArgs(siteId).returns(siteDeletedAction);

      const actual = fixture.deleteSite(siteId);
      
      return actual.then(() => {
        expect(dispatch.callCount).to.equal(2);
        expect(dispatch.calledWith(siteDeletedAction)).to.be.true
        expect(dispatch.calledWith(routerAction)).to.be.true;
      });
    });

    it("triggers an error when deleting a site fails", () => {
      const siteId = "fohjf892unsfkgh3874t249ofmlsfjngu";
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      deleteSite.withArgs(siteId).returns(rejectedWithErrorPromise);

      const actual = fixture.deleteSite(siteId);
      
      return actual.then(() => {
        dispatchesAnAlertError(errorMessage);
      });
    });
  });

  describe("fetchFiles", () => {
    it("triggers the fetching of a site's files for a path and dispatches a site files received action to the store when successful", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        could: "be anything"
      };
      const path = "/lookee/here";
      const files = {
        fee: "fie",
        fo: "fum"
      };
      const filePromise = Promise.resolve(files);
      fetchRepositoryContent.withArgs(site, path).returns(filePromise);
      const siteFilesReceivedAction = {
        action: "files have received, make your time"
      };
      siteFilesReceivedActionCreator.withArgs(id, files).returns(siteFilesReceivedAction);

      const actual = fixture.fetchFiles(site, path);
      
      return actual.then(() => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteFilesReceivedAction)).to.be.true;
      });
    });

    it("triggers an error when fetching a site's files for a path fails", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        could: "be anything"
      };
      const path = "/lookee/here";
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      fetchRepositoryContent.withArgs(site, path).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchFiles(site, path);
      
      return actual.then(() => {
        dispatchesAnAlertError(errorMessage);
      });
    });
  });

  describe("fetchFileContent", () => {
    it("triggers the fetching of a site's file content for a path and dispatches a site files received action to the store when successful", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        could: "be anything"
      };
      const path = "/lookee/here";
      const file = {
        fee: "fie",
        fo: "fum"
      };
      const filePromise = Promise.resolve(file);
      const siteFileContentReceivedAction = {
        action: "reaction"
      };
      fetchRepositoryContent.withArgs(site, path).returns(filePromise);
      siteFileContentReceivedActionCreator.withArgs(id, file).returns(siteFileContentReceivedAction);

      const actual = fixture.fetchFileContent(site, path);
      
      return actual.then(() => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteFileContentReceivedAction)).to.be.true;
      });
    });

    it("does nothing when fetching a site's file content for a path fails", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        could: "be anything"
      };
      const path = "/lookee/here";
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      fetchRepositoryContent.withArgs(site, path).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchFileContent(site, path);
      
      return actual.catch(() => {
        expect(dispatch.called).to.be.false;
      });
    });
  });

  describe("fetchSiteConfigs", () => {
    it("triggers the fetching of a site's configs and dispatches a site configs received action to the store when successful", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        could: "be anything"
      };
      const configs = {
        fee: "fie",
        fo: "fum"
      };
      const configsPromise = Promise.resolve(configs);
      fetchRepositoryConfigs.withArgs(site).returns(configsPromise);

      const actual = fixture.fetchSiteConfigs(site);
      
      return actual.then((result) => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith({
          type: SITE_CONFIGS_RECEIVED,
          siteId: id,
          configs
        })).to.be.true;
        expect(result).to.equal(site);
      });
    });

    it("does nothing when fetching a site's configs fails", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        could: "be anything"
      };
      const path = "/lookee/here";
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      fetchRepositoryConfigs.withArgs(site).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSiteConfigs(site);
      
      return actual.catch(() => {
        expect(dispatch.called).to.be.false;
      });
    });
  });

  describe("createCommit", () => {
    it("creates a commit with the default message, no sha, and the specified branch and dispatches a site file added action to the store when successful", () => {
      // FIXME: this is a particularly complicated test whose creation comes very directly
      // from looking at the implementation. Neither of those are good things.
      const id = "kuaw8fsru8hwugfw";
      const branch = "branch-o-rama";
      const site = {
        id: id,
        branch: branch,
        could: "be anything"
      };
      const path = "/what/is/this/path/of/which/you/speak";
      const content = {
        something: "here",
        might: "be",
        or: "maybe not"
      };
      const encodedContent = "blah";
      const commitObject = {
        content: content
      };
      encodeB64.withArgs(content).returns(encodedContent);
      const commitObjectPromise = Promise.resolve(commitObject);
      const expectedCommit = {
        path: path,
        message: `Adds ${path} to project`,
        content: encodedContent,
        branch: branch
      };
      const siteFileContentReceivedAction = {
        action: "reaction"
      };
      siteFileContentReceivedActionCreator.withArgs(id, content).returns(siteFileContentReceivedAction);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);
      const actual = fixture.createCommit(site, path, content);
      
      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteFileContentReceivedAction)).to.be.true;
      });
    });
    
    it("creates a commit with the specified message, no sha, and default branch and dispatches a site file added action to the store when successful", () => {
      // FIXME: this is a particularly complicated test whose creation comes very directly
      // from looking at the implementation. Neither of those are good things.
      const message = "twinkle twinkle little star";
      const id = "kuaw8fsru8hwugfw";
      const branch = "default-branch-o-rama";
      const site = {
        id: id,
        defaultBranch: branch,
        could: "be anything"
      };
      const path = "/what/is/this/path/of/which/you/speak";
      const content = {
        something: "here",
        might: "be",
        or: "maybe not"
      };
      const encodedContent = "blah";
      const commitObject = {
        content: content
      };
      encodeB64.withArgs(content).returns(encodedContent);
      const commitObjectPromise = Promise.resolve(commitObject);
      const expectedCommit = {
        path: path,
        message: message,
        content: encodedContent,
        branch: branch
      };
      const siteFileContentReceivedAction = {
        action: "reaction"
      };
      siteFileContentReceivedActionCreator.withArgs(id, content).returns(siteFileContentReceivedAction);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

      const actual = fixture.createCommit(site, path, content, message);
      
      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteFileContentReceivedAction)).to.be.true;
      });    
    });

    it("creates a commit with the default message, a sha, and the specified branch and dispatches a site file added action to the store when successful", () => {
      // FIXME: this is a particularly complicated test whose creation comes very directly
      // from looking at the implementation. Neither of those are good things.
      const sha = "euvuhvauy2498u0294fjerhv98ewyg0942jviuehgiorefjhviofdsjv";
      const id = "kuaw8fsru8hwugfw";
      const branch = "branch-o-rama";
      const site = {
        id: id,
        branch: branch,
        could: "be anything"
      };
      const path = "/what/is/this/path/of/which/you/speak";
      const content = {
        something: "here",
        might: "be",
        or: "maybe not"
      };
      const encodedContent = "blah";
      const commitObject = {
        content: content
      };
      encodeB64.withArgs(content).returns(encodedContent);
      const commitObjectPromise = Promise.resolve(commitObject);
      const expectedCommit = {
        path: path,
        message: `Adds ${path} to project`,
        content: encodedContent,
        sha: sha,
        branch: branch
      };
      const siteFileContentReceivedAction = {
        action: "reaction"
      };
      siteFileContentReceivedActionCreator.withArgs(id, content).returns(siteFileContentReceivedAction);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

      const actual = fixture.createCommit(site, path, content, false, sha);
      
      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteFileContentReceivedAction)).to.be.true;
      });    
    });
  });

  describe("fetchSiteAssets", () => {
    it("fetches a site's assets with no configed asset path and dispatches a site assets received action to the store when successful, returning the same site given", () => {
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        "_config.yml": {
          blank: "blank blank blank"
        },
        could: "be anything"
      };
      const bAsset = {
        name: "you should pay attention to me",
        type: "file"
      };
      const assets = [
        {
          name: "fie",
          type: "nothing"
        },
        bAsset,
        {
          whatever: "you say, no type"
        }
      ];
      
      const assetsPromise = Promise.resolve(assets);
      const siteAssetsReceivedAction = {
        assets: "negative"
      };
      fetchRepositoryContent.withArgs(site, "assets").returns(assetsPromise);
      siteAssetsReceivedActionCreator.withArgs(id, [ bAsset ]).returns(siteAssetsReceivedAction);

      const actual = fixture.fetchSiteAssets(site);
      
      return actual.then((result) => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteAssetsReceivedAction)).to.be.true;
        expect(result).to.equal(site);
      });
    });
    
    it("fetches a site's assets with a configed asset path and dispatches a site assets received action to the store when successful, returning the same site given", () => {
      const assetPath = "/go/directly/here";
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        "_config.yml": {
          assetPath: assetPath
        },
        could: "be anything"
      };
      const bAsset = {
        name: "you should pay attention to me",
        type: "file"
      };
      const assets = [
        {
          name: "fie",
          type: "nothing"
        },
        bAsset,
        {
          whatever: "you say, no type"
        }
      ];
      
      const assetsPromise = Promise.resolve(assets);
      const siteAssetsReceivedAction = {
        assets: "negative"
      };
      fetchRepositoryContent.withArgs(site, assetPath).returns(assetsPromise);
      siteAssetsReceivedActionCreator.withArgs(id, [ bAsset ]).returns(siteAssetsReceivedAction);

      const actual = fixture.fetchSiteAssets(site);
      
      return actual.then((result) => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(siteAssetsReceivedAction)).to.be.true;
        expect(result).to.equal(site);
      });
    });

    it("triggers an error when fetching the site assets fails", () => {
      const assetPath = "/go/directly/here";
      const id = "kuaw8fsru8hwugfw";
      const site = {
        id: id,
        "_config.yml": {
          assetPath: assetPath
        },
        could: "be anything"
      };
      const errorMessage = "it failed.";
      const error = {
        message: errorMessage
      };
      const rejectedWithErrorPromise = Promise.reject(error);
      fetchRepositoryContent.withArgs(site, assetPath).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSiteAssets(site);
      
      return actual.then(() => {
        dispatchesAnAlertError(errorMessage);
      });
    });
  });
  
  const dispatchesAnAlertError = (errorMessage) => {
    expect(dispatch.called).to.be.false;
    expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
  };
});
