import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("siteActions", () => {
  let fixture;
  let dispatch;
  let fetchRepositoryContent, fetchRepositoryConfigs, createCommit, fetchBranches,
      deleteBranch, createRepo;
  let fetchSites, addSite, updateSite, deleteSite, cloneRepo, createBranch;
  let addPathToSite, uploadFileToSite, createDraftBranchName, findShaForDefaultBranch, convertFileToData;
  let httpErrorAlertAction, alertSuccess, alertError;
  let sitesReceivedActionCreator, siteAddedActionCreator, siteDeletedActionCreator,
      siteUpdatedActionCreator, siteFileContentReceivedActionCreator, siteAssetsReceivedActionCreator,
      siteFilesReceivedActionCreator, siteConfigsReceivedActionCreator, siteBranchesReceivedActionCreator,
      updateRouterActionCreator;

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
    dispatch = spy();
    httpErrorAlertAction = spy();
    fetchSites = stub();
    addSite = stub();
    updateSite = stub();
    deleteSite = stub();
    cloneRepo = stub();
    createBranch = stub();
    fetchRepositoryContent = stub();
    fetchRepositoryConfigs = stub();
    createCommit = stub();
    fetchBranches = stub();
    deleteBranch = stub();
    createRepo = stub();
    addPathToSite = stub();
    uploadFileToSite = stub();
    alertSuccess = stub();
    alertError = stub();
    sitesReceivedActionCreator = stub();
    updateRouterActionCreator = stub();
    siteAddedActionCreator = stub();
    siteUpdatedActionCreator = stub();
    siteDeletedActionCreator = stub();
    siteFileContentReceivedActionCreator = stub();
    siteAssetsReceivedActionCreator = stub();
    siteFilesReceivedActionCreator = stub();
    siteConfigsReceivedActionCreator = stub();
    siteBranchesReceivedActionCreator = stub();
    createDraftBranchName = stub();
    findShaForDefaultBranch = stub();
    convertFileToData = stub();
    
    // FIXME: complex dependency wiring a smell
    fixture = proxyquire("../../../../assets/app/actions/siteActions", {
      "./actionCreators/siteActions": {
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
        siteFileContentReceived: siteFileContentReceivedActionCreator,
        siteAssetsReceived: siteAssetsReceivedActionCreator,
        siteFilesReceived: siteFilesReceivedActionCreator,
        siteConfigsReceived: siteConfigsReceivedActionCreator,
        siteBranchesReceived: siteBranchesReceivedActionCreator
      },
      "./actionCreators/navigationActions": {
        updateRouter: updateRouterActionCreator
      },
      "../store": {
        dispatch: dispatch
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
        deleteSite: deleteSite,
        cloneRepo: cloneRepo
      },
      "../util/githubApi": {
        fetchRepositoryContent: fetchRepositoryContent,
        fetchRepositoryConfigs: fetchRepositoryConfigs,
        createCommit: createCommit,
        fetchBranches: fetchBranches,
        deleteBranch: deleteBranch,
        createRepo: createRepo,
        createBranch: createBranch
      },
      "./makeCommitData": {
        addPathToSite: addPathToSite,
        uploadFileToSite: uploadFileToSite
      },
      "./createDraftBranchName": createDraftBranchName,
      "./findShaForDefaultBranch": findShaForDefaultBranch,
      '../util/convertFileToData': convertFileToData
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
        expectDispatchOfSingleAction(dispatch, action);
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
      const siteUpdatedAction = {
        action: "wait, what's my queue?"
      };
      const sitePromise = Promise.resolve(site);
      updateSite.withArgs(siteToUpdate, data).returns(sitePromise);
      siteUpdatedActionCreator.withArgs(site).returns(siteUpdatedAction);
      
      const actual = fixture.updateSite(siteToUpdate, data);
      
      return actual.then(() => {
        expectDispatchOfSingleAction(dispatch, siteUpdatedAction);
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
      deleteSite.withArgs(siteId).returns(rejectedWithErrorPromise);

      const actual = fixture.deleteSite(siteId);
      
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("fetchFiles", () => {
    it("triggers the fetching of a site's files for a path and dispatches a site files received action to the store when successful", () => {
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
      siteFilesReceivedActionCreator.withArgs(siteId, files).returns(siteFilesReceivedAction);

      const actual = fixture.fetchFiles(site, path);
      
      return actual.then(() => {
        expectDispatchOfSingleAction(dispatch, siteFilesReceivedAction);
      });
    });

    it("triggers an error when fetching a site's files for a path fails", () => {
      const path = "/lookee/here";
      fetchRepositoryContent.withArgs(site, path).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchFiles(site, path);
      
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("fetchFileContent", () => {
    it("triggers the fetching of a site's file content for a path and dispatches a site files received action to the store when successful", () => {
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
      siteFileContentReceivedActionCreator.withArgs(siteId, file).returns(siteFileContentReceivedAction);

      const actual = fixture.fetchFileContent(site, path);
      
      return actual.then(() => {
        expectDispatchOfSingleAction(dispatch, siteFileContentReceivedAction);
      });
    });

    it("does nothing when fetching a site's file content for a path fails", () => {
      const path = "/lookee/here";
      fetchRepositoryContent.withArgs(site, path).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchFileContent(site, path);

      expectDispatchToNotBeCalled(actual);
    });
  });

  describe("fetchSiteConfigs", () => {
    it("triggers the fetching of a site's configs and dispatches a site configs received action to the store when successful", () => {
      const configs = {
        fee: "fie",
        fo: "fum"
      };
      const configsPromise = Promise.resolve(configs);
      const siteConfigsReceivedAction = {
        foo: "bar"
      };
      fetchRepositoryConfigs.withArgs(site).returns(configsPromise);
      siteConfigsReceivedActionCreator.withArgs(siteId, configs).returns(siteConfigsReceivedAction);

      const actual = fixture.fetchSiteConfigs(site);
      
      return actual.then((result) => {
        expectDispatchOfSingleAction(dispatch, siteConfigsReceivedAction);
        expect(result).to.equal(site);
      });
    });

    it("does nothing when fetching a site's configs fails", () => {
      const path = "/lookee/here";
      fetchRepositoryConfigs.withArgs(site).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSiteConfigs(site);
      
      expectDispatchToNotBeCalled(actual);
    });
  });

  describe("createCommit", () => {
    it("creates a commit with no message or sha and dispatches a site file added action to the store when successful", () => {
      const siteId = "kuaw8fsru8hwugfw";
      const site = {
        id: siteId,
        could: "be anything"
      };
      const path = "/what/is/this/path/of/which/you/speak";
      const content = {
        something: "here",
        might: "be",
        or: "maybe not"
      };
      const commitObject = {
        content: content
      };
      const commitObjectPromise = Promise.resolve(commitObject);
      const expectedCommit = {
        you: "get something to represent your commit"
      };
      const siteFileContentReceivedAction = {
        action: "reaction"
      };
      addPathToSite.withArgs(site, path, content, false, false).returns(expectedCommit);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);
      siteFileContentReceivedActionCreator.withArgs(siteId, content).returns(siteFileContentReceivedAction);

      const actual = fixture.createCommit(site, path, content);
      
      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expectDispatchOfSingleAction(dispatch, siteFileContentReceivedAction);
      });
    });

    it("creates a commit with the specified message and a sha and dispatches a site file added action to the store when successful", () => {
      const sha = "euvuhvauy2498u0294fjerhv98ewyg0942jviuehgiorefjhviofdsjv";
      const siteId = "kuaw8fsru8hwugfw";
      const site = {
        id: siteId,
        could: "be anything"
      };
      const message = "this one goes out to the one i compile";
      const path = "/what/is/this/path/of/which/you/speak";
      const content = {
        something: "here",
        might: "be",
        or: "maybe not"
      };
      const commitObject = {
        content: content
      };
      const commitObjectPromise = Promise.resolve(commitObject);
      const expectedCommit = {
        you: "get something to represent your commit"
      };
      const siteFileContentReceivedAction = {
        action: "reaction"
      };
      addPathToSite.withArgs(site, path, content, message, sha).returns(expectedCommit);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);
      siteFileContentReceivedActionCreator.withArgs(siteId, content).returns(siteFileContentReceivedAction);

      const actual = fixture.createCommit(site, path, content, message, sha);
      
      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expectDispatchOfSingleAction(dispatch, siteFileContentReceivedAction);
      });    
    });
        
    it("triggers an error when creating a commit fails", () => {
      const sha = "euvuhvauy2498u0294fjerhv98ewyg0942jviuehgiorefjhviofdsjv";
      const message = "this one goes out to the one i compile";
      const path = "/what/is/this/path/of/which/you/speak";
      const content = {
        something: "here",
        might: "be",
        or: "maybe not"
      };
      const expectedCommit = {
        you: "get something to represent your commit"
      };
      addPathToSite.withArgs(site, path, content, message, sha).returns(expectedCommit);
      createCommit.withArgs(site, path, expectedCommit).returns(rejectedWithErrorPromise);
      fetchSites.withArgs().returns(rejectedWithErrorPromise);

      const actual = fixture.createCommit(site, path, content, message, sha);
      
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });

  });

  describe("fetchSiteAssets", () => {
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

    it("fetches a site's assets with no configed asset path and dispatches a site assets received action to the store when successful, returning the same site given", () => {
      const site = {
        id: siteId,
        "_config.yml": {
          blank: "blank blank blank"
        },
        could: "be anything"
      };
      
      const assetsPromise = Promise.resolve(assets);
      const siteAssetsReceivedAction = {
        assets: "negative"
      };
      fetchRepositoryContent.withArgs(site, "assets").returns(assetsPromise);
      siteAssetsReceivedActionCreator.withArgs(siteId, [ bAsset ]).returns(siteAssetsReceivedAction);

      const actual = fixture.fetchSiteAssets(site);
      
      return actual.then((result) => {
        expectDispatchOfSingleAction(dispatch, siteAssetsReceivedAction);
        expect(result).to.equal(site);
      });
    });
    
    it("fetches a site's assets with a configed asset path and dispatches a site assets received action to the store when successful, returning the same site given", () => {
      const assetPath = "/go/directly/here";
      const site = {
        id: siteId,
        "_config.yml": {
          assetPath: assetPath
        },
        could: "be anything"
      };
      
      const assetsPromise = Promise.resolve(assets);
      const siteAssetsReceivedAction = {
        assets: "negative"
      };
      fetchRepositoryContent.withArgs(site, assetPath).returns(assetsPromise);
      siteAssetsReceivedActionCreator.withArgs(siteId, [ bAsset ]).returns(siteAssetsReceivedAction);

      const actual = fixture.fetchSiteAssets(site);
      
      return actual.then((result) => {
        expectDispatchOfSingleAction(dispatch, siteAssetsReceivedAction);
        expect(result).to.equal(site);
      });
    });

    it("triggers an error when fetching the site assets fails", () => {
      const assetPath = "/go/directly/here";
      const site = {
        id: siteId,
        "_config.yml": {
          assetPath: assetPath
        },
        could: "be anything"
      };
      fetchRepositoryContent.withArgs(site, assetPath).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSiteAssets(site);
      
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
      const siteBranchesReceivedAction = {
        branches: "r us"
      };
      fetchBranches.withArgs(site).returns(branchesPromise);
      siteBranchesReceivedActionCreator.withArgs(siteId, branches).returns(siteBranchesReceivedAction);

      const actual = fixture.fetchBranches(site);
      
      return actual.then((result) => {
        expectDispatchOfSingleAction(dispatch, siteBranchesReceivedAction);
        expect(result).to.equal(site);
      });
    });
    
    it("does nothing when fetching a site's branches fails", () => {
      fetchBranches.withArgs(site).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchBranches(site);
      
      expectDispatchToNotBeCalled(actual);
    });
  });

  describe("delete(Site)Branch", () => {
    const branch = "hi";

    it("deletes a branch for a site's branches and, if successful, then fetches the site's branches again and dispatches a site branches received action to the store when successful, returning the same site given", () => {
      const branches = {
        blurry: "vision",
        get: "glasses"
      };
      const deleteBranchPromise = Promise.resolve("ig-nored");
      const branchesPromise = Promise.resolve(branches);
      const siteBranchesReceivedAction = {
        branches: "r us"
      };
      deleteBranch.withArgs(site, branch).returns(deleteBranchPromise);
      fetchBranches.withArgs(site).returns(branchesPromise);
      siteBranchesReceivedActionCreator.withArgs(siteId, branches).returns(siteBranchesReceivedAction);

      const actual = fixture.deleteBranch(site, branch);
      
      return actual.then((result) => {
        expectDispatchOfSingleAction(dispatch, siteBranchesReceivedAction);
        expect(result).to.equal(site);
      });
    });
    
    it("alerts an error when deleting a site's branch fails", () => {
      deleteBranch.withArgs(site, branch).returns(rejectedWithErrorPromise);

      const actual = fixture.deleteBranch(site, branch);
      
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
    
    it("alerts an error when fetching branches fails after successfully deleting a site's branch", () => {
      const deleteBranchPromise = Promise.resolve("ig-nored");
      deleteBranch.withArgs(site, branch).returns(deleteBranchPromise);
      fetchBranches.withArgs(site).returns(rejectedWithErrorPromise);

      const actual = fixture.deleteBranch(site, branch);
      
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });    
  });

  describe("cloneRepo", () => {
    const destination = "destination";
    const source = "source";

    it("dispatches a site added action and redirects to a site uri if we successfully create and clone a repo", () => {
      const sitePromise = Promise.resolve(site);
      const siteAddedAction = {
        action: "yep"
      };
      const routerAction = {
        whatever: "bub"
      };
      createRepo.withArgs(destination, source).returns(Promise.resolve("ignored"));
      cloneRepo.withArgs(destination, source).returns(sitePromise);
      updateRouterActionCreator.withArgs(`/sites/${siteId}`).returns(routerAction);
      siteAddedActionCreator.withArgs(site).returns(siteAddedAction);

      const actual = fixture.cloneRepo(destination, source);

      return actual.then(() => {
        expect(dispatch.callCount).to.equal(2);
        
        expect(dispatch.calledWith(siteAddedAction)).to.be.true;
        expect(dispatch.calledWith(routerAction)).to.be.true;
      });
    });
    
    it("alerts an error if createRepo fails", () => {
      createRepo.withArgs(destination, source).returns(rejectedWithErrorPromise);

      const actual = fixture.cloneRepo(destination, source);
      
      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
    
    it("alerts an error if cloneRepo fails", () => {
      createRepo.withArgs(destination, source).returns(Promise.resolve("ignored"));
      cloneRepo.withArgs(destination, source).returns(rejectedWithErrorPromise);

      const actual = fixture.cloneRepo(destination, source);

      return validateResultDispatchesHttpAlertError(actual, errorMessage);
    });
  });

  describe("createDraftBranch", () => {
    const path = "everybody/get/up";
    const sha = "sha sha sha";
    const draftBranchName = "hi";

    it("creates a draft branch, if successful, then fetches the site's branches again and dispatches a site branches received action to the store when successful, returning the new draft branch name created", () => {
      const branches = {
        whatever: "dude"
      };
      const createBranchPromise = Promise.resolve("ig-nored");
      const branchesPromise = Promise.resolve(branches);
      const siteBranchesReceivedAction = {
        branches: "r us"
      };
      createDraftBranchName.withArgs(path).returns(draftBranchName);
      findShaForDefaultBranch.withArgs(site).returns(sha);
      createBranch.withArgs(site, draftBranchName, sha).returns(createBranchPromise);
      fetchBranches.withArgs(site).returns(branchesPromise);
      siteBranchesReceivedActionCreator.withArgs(siteId, branches).returns(siteBranchesReceivedAction);

      const actual = fixture.createDraftBranch(site, path);
      
      return actual.then((result) => {
        expectDispatchOfSingleAction(dispatch, siteBranchesReceivedAction);
        expect(result).to.equal(draftBranchName);
      });
    });
    
    it("does nothing when creating a branch fails", () => {
      createDraftBranchName.withArgs(path).returns(draftBranchName);
      findShaForDefaultBranch.withArgs(site).returns(sha);
      createBranch.withArgs(site, draftBranchName, sha).returns(rejectedWithErrorPromise);

      const actual = fixture.createDraftBranch(site, path);
      
      expectDispatchToNotBeCalled(actual);
    });
  });

  describe("uploadFile", () => {
    const filename = "files need a name, you see"; 
    const file = {
      name: filename
    };

    it("alerts an error when it fails to convert a file to data", () => {
      convertFileToData.withArgs(file).returns(rejectedWithErrorPromise);

      const actual = fixture.uploadFile(site, file);
      
      return validateResultDispatchesAlertError(actual, errorMessage);
    });

    it("alerts an error when it fails to create a commit with github", () => {
      const content = {
        something: "here"
      };
      const contentPromise = Promise.resolve(content);
      const expectedCommit = {
        something: "else"
      };
      // FIXME: this seems a little strange for us to know at this level
      const expectedPath = `assets/${filename}`;
      convertFileToData.withArgs(file).returns(contentPromise);
      uploadFileToSite.withArgs(filename, content).returns(expectedCommit);
      createCommit.withArgs(site, expectedPath, expectedCommit).returns(rejectedWithErrorPromise);

      const actual = fixture.uploadFile(site, file);
      
      return validateResultDispatchesAlertError(actual, errorMessage);
    });

    it("alerts a success and fetches assets when it successfully create a commit with github", () => {
      const content = {
        something: "here"
      };
      const contentPromise = Promise.resolve(content);
      const expectedCommit = {
        something: "else"
      };
      // FIXME: this seems a little strange for us to know at this level
      const expectedPath = `assets/${filename}`;
      const ignoredPromise = Promise.resolve("whatever.");
      convertFileToData.withArgs(file).returns(contentPromise);
      uploadFileToSite.withArgs(filename, content).returns(expectedCommit);
      createCommit.withArgs(site, expectedPath, expectedCommit).returns(ignoredPromise);

      const actual = fixture.uploadFile(site, file);

      return actual.then(() => {
        expect(alertSuccess.calledWith("File uploaded successfully")).to.be.true;
        expect(fetchRepositoryContent.calledWith(site, "assets"));
      });    
    });

    it("alerts a success and fetches assets when it successfully create a commit with github, with a sha", () => {
      const sha = "sha sha sha!";
      const content = {
        something: "here"
      };
      const contentPromise = Promise.resolve(content);
      const expectedCommit = {
        something: "else"
      };
      // FIXME: this seems a little strange for us to know at this level
      const expectedPath = `assets/${filename}`;
      const ignoredPromise = Promise.resolve("whatever.");
      convertFileToData.withArgs(file).returns(contentPromise);
      uploadFileToSite.withArgs(filename, content, sha).returns(expectedCommit);
      createCommit.withArgs(site, expectedPath, expectedCommit).returns(ignoredPromise);

      const actual = fixture.uploadFile(site, file, sha);

      return actual.then(() => {
        expect(alertSuccess.calledWith("File uploaded successfully")).to.be.true;
        expect(fetchRepositoryContent.calledWith(site, "assets"));
      });    
    });
  });
  
  const expectDispatchToNotBeCalled = (promise, dispatch) => {
    promise.catch(() => {
      expect(dispatch.called).to.be.false;
    });
  };
  
  const expectDispatchOfSingleAction = (dispatch, action) => {
    expect(dispatch.calledOnce).to.be.true;
    expect(dispatch.calledWith(action)).to.be.true;
  };

  const validateResultDispatchesHttpAlertError = (promise, errorMessage) => {
    return promise.then(() => {
      expectDispatchOfHttpErrorAlert(errorMessage);
    });
  };
  
  const expectDispatchOfHttpErrorAlert = errorMessage => {
    expect(dispatch.called).to.be.false;
    expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
  };
    
  const validateResultDispatchesAlertError = (promise, errorMessage) => {
    return promise.then(() => {
      expectDispatchOfErrorAlert(errorMessage);
    });
  };
  
  const expectDispatchOfErrorAlert = errorMessage => {
    expect(dispatch.called).to.be.false;
    expect(alertError.calledWith(errorMessage)).to.be.true;
  };

});
