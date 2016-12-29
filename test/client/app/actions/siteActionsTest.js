import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("siteActions", () => {
  let fixture;

  let fetchRepositoryContent, fetchRepositoryConfigs, createCommit, fetchBranches,
      deleteBranch, createRepo, fetchFile, getRepo;

  let fetchSites, addSite, updateSite, deleteSite, createBranch,
      createPullRequest, mergePullRequest, fetchPullRequests, siteExists,
      fetchSiteNavigationFile, fetchSiteAssets;

  let addPathToSite, uploadFileToSite, formatDraftBranchName, findShaForDefaultBranch, convertFileToData,
      filterAssetsWithTypeOfFile;

  let httpErrorAlertAction, alertSuccess, alertError;

  let updateRouterToSitesUri, updateRouterToSpecificSiteUri, dispatchSitesReceivedAction,
      dispatchSiteAddedAction, dispatchSiteUpdatedAction, dispatchSiteDeletedAction,
      dispatchSiteFileContentReceivedAction, dispatchSiteAssetsReceivedAction,
      dispatchSiteFilesReceivedAction, dispatchSiteConfigsReceivedAction,
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
    createBranch = stub();
    fetchPullRequests = stub();
    createPullRequest = stub();
    mergePullRequest = stub();
    fetchRepositoryContent = stub();
    fetchRepositoryConfigs = stub();
    fetchFile = stub();
    createCommit = stub();
    fetchBranches = stub();
    deleteBranch = stub();
    createRepo = stub();
    addPathToSite = stub();
    uploadFileToSite = stub();
    alertSuccess = stub();
    alertError = stub();
    siteExists = stub();
    fetchSiteNavigationFile = stub();
    fetchSiteAssets = stub();

    updateRouterToSitesUri = stub();
    updateRouterToSpecificSiteUri = stub();
    dispatchSitesReceivedAction = stub();
    dispatchSiteAddedAction = stub();
    dispatchSiteUpdatedAction = stub();
    dispatchSiteDeletedAction = stub();
    dispatchSiteFileContentReceivedAction = stub();
    dispatchSiteAssetsReceivedAction = stub();
    dispatchSiteFilesReceivedAction = stub();
    dispatchSiteConfigsReceivedAction = stub();
    dispatchSiteBranchesReceivedAction = stub();
    dispatchSiteInvalidAction = stub();
    dispatchSiteLoadingAction = stub();

    formatDraftBranchName = stub();
    findShaForDefaultBranch = stub();
    convertFileToData = stub();
    filterAssetsWithTypeOfFile = stub();

    fixture = proxyquire("../../../../assets/app/actions/siteActions", {
      "./dispatchActions": {
        updateRouterToSitesUri: updateRouterToSitesUri,
        updateRouterToSpecificSiteUri: updateRouterToSpecificSiteUri,
        dispatchSitesReceivedAction: dispatchSitesReceivedAction,
        dispatchSiteAddedAction: dispatchSiteAddedAction,
        dispatchSiteUpdatedAction: dispatchSiteUpdatedAction,
        dispatchSiteDeletedAction: dispatchSiteDeletedAction,
        dispatchSiteFileContentReceivedAction: dispatchSiteFileContentReceivedAction,
        dispatchSiteAssetsReceivedAction: dispatchSiteAssetsReceivedAction,
        dispatchSiteFilesReceivedAction: dispatchSiteFilesReceivedAction,
        dispatchSiteConfigsReceivedAction: dispatchSiteConfigsReceivedAction,
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
        fetchRepositoryContent: fetchRepositoryContent,
        fetchRepositoryConfigs: fetchRepositoryConfigs,
        createCommit: createCommit,
        fetchBranches: fetchBranches,
        fetchPullRequests: fetchPullRequests,
        deleteBranch: deleteBranch,
        createRepo: createRepo,
        createBranch: createBranch,
        createPullRequest: createPullRequest,
        mergePullRequest: mergePullRequest,
        getRepo: getRepo
      },
      '../util/s3Api': {
        fetchFile: fetchFile
      },
      "../util/makeCommitData": {
        addPathToSite: addPathToSite,
        uploadFileToSite: uploadFileToSite
      },
      "../util/branchFormatter": {
        formatDraftBranchName: formatDraftBranchName
      },
      "../util/findShaForDefaultBranch": findShaForDefaultBranch,
      "../util/convertFileToData": convertFileToData,
      "../util/filterAssetsWithTypeOfFile": filterAssetsWithTypeOfFile
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

  describe("fetchFiles", () => {
    it("triggers the fetching of a site's files for a path and dispatches a site files received action to the store when successful", () => {
      const path = "/lookee/here";
      const files = {
        fee: "fie",
        fo: "fum"
      };
      const filePromise = Promise.resolve(files);
      fetchRepositoryContent.withArgs(site, path).returns(filePromise);

      const actual = fixture.fetchFiles(site, path);

      return actual.then(() => {
        expect(dispatchSiteFilesReceivedAction.calledWith(siteId, files)).to.be.true;
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
      fetchRepositoryContent.withArgs(site, path).returns(filePromise);

      const actual = fixture.fetchFileContent(site, path);

      return actual.then(() => {
        expect(dispatchSiteFileContentReceivedAction.calledWith(siteId, file)).to.be.true;
      });
    });

    it("does nothing when fetching a site's file content for a path fails", () => {
      const path = "/lookee/here";
      fetchRepositoryContent.withArgs(site, path).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchFileContent(site, path);

      expectDispatchToNotBeCalled(actual, dispatchSiteFileContentReceivedAction);
    });
  });

  describe("fetchSiteConfigs", () => {
    it("triggers the fetching of a site's configs and dispatches a site configs received action to the store when successful", () => {
      const configs = {
        fee: "fie",
        fo: "fum"
      };

      const configsPromise = Promise.resolve(configs);
      fetchRepositoryConfigs.withArgs(site).returns(configsPromise);
      fetchFile.withArgs(site, '_navigation.json').returns(configsPromise);

      const actual = fixture.fetchSiteConfigs(site);

      return actual.then((result) => {
        expect(dispatchSiteConfigsReceivedAction.calledWith(siteId, configs)).to.be.true;
        expect(result).to.equal(site);
      });
    });

    it("returns only the config if fetching navigation.json fails", () => {
      const configs = {
        fee: "fie",
        fo: "fum"
      };
      const resolvedPromise = Promise.resolve(configs);
      const rejectedPromise = Promise.reject('Try again');

      fetchRepositoryConfigs.withArgs(site).returns(resolvedPromise);
      fetchFile.withArgs(site, '_navigation.json').returns(rejectedPromise);

      const actual = fixture.fetchSiteConfigs(site);

      return actual.then((result) => {
        expect(dispatchSiteConfigsReceivedAction.calledWith(siteId, configs)).to.be.true;
        expect(result).to.equal(site);
      });
    });

    it("does nothing when fetching a site's configs fails", () => {
      fetchRepositoryConfigs.withArgs(site).returns(rejectedWithErrorPromise);

      const actual = fixture.fetchSiteConfigs(site);

      expectDispatchToNotBeCalled(actual, dispatchSiteConfigsReceivedAction);
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
      addPathToSite.withArgs(site, path, content, false, false).returns(expectedCommit);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

      const actual = fixture.createCommit(site, path, content);

      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expect(dispatchSiteFileContentReceivedAction.calledWith(siteId, content)).to.be.true;
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
      addPathToSite.withArgs(site, path, content, message, sha).returns(expectedCommit);
      createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

      const actual = fixture.createCommit(site, path, content, message, sha);

      return actual.then(() => {
        expect(alertSuccess.calledWith("File committed successfully")).to.be.true;
        expect(dispatchSiteFileContentReceivedAction.calledWith(siteId, content)).to.be.true;
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
    const assets = [
      {
        name: "fie",
        type: "nothing"
      },
      {
        whatever: "you say, no type"
      }
    ];
    const filteredAssets = [{
      name: "you should pay attention to me",
      type: "file"
    }];

    it("fetches a site's assets with no configed asset path and dispatches a site assets received action to the store when successful, returning the same site given", () => {
      const site = {
        id: siteId,
        "_config.yml": {
          blank: "blank blank blank"
        },
        could: "be anything"
      };

      const assetsPromise = Promise.resolve(assets);
      fetchRepositoryContent.withArgs(site, "assets").returns(assetsPromise);
      filterAssetsWithTypeOfFile.withArgs(assets).returns(filteredAssets);

      const actual = fixture.fetchSiteAssets(site);

      return actual.then((result) => {
        expect(dispatchSiteAssetsReceivedAction.calledWith(siteId, filteredAssets)).to.be.true;
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
      fetchRepositoryContent.withArgs(site, assetPath).returns(assetsPromise);
      filterAssetsWithTypeOfFile.withArgs(assets).returns(filteredAssets);

      const actual = fixture.fetchSiteAssets(site);

      return actual.then((result) => {
        expect(dispatchSiteAssetsReceivedAction.calledWith(siteId, filteredAssets)).to.be.true;
        expect(result).to.equal(site);
      });
    });

    it("throws an error when fetching the site assets fails", () => {
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

      return expectDispatchToNotBeCalled(actual, httpErrorAlertAction);
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

  describe("delete(Site)Branch", () => {
    const branch = "hi";

    it("deletes a branch for a site's branches and, if successful, then fetches the site's branches again and dispatches a site branches received action to the store when successful, returning the same site given", () => {
      const branches = {
        blurry: "vision",
        get: "glasses"
      };
      const deleteBranchPromise = Promise.resolve("ig-nored");
      const branchesPromise = Promise.resolve(branches);
      deleteBranch.withArgs(site, branch).returns(deleteBranchPromise);
      fetchBranches.withArgs(site).returns(branchesPromise);

      const actual = fixture.deleteBranch(site, branch);

      return actual.then((result) => {
        expect(dispatchSiteBranchesReceivedAction.calledWith(siteId, branches)).to.be.true;
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
      formatDraftBranchName.withArgs(path).returns(draftBranchName);
      findShaForDefaultBranch.withArgs(site).returns(sha);
      createBranch.withArgs(site, draftBranchName, sha).returns(createBranchPromise);
      fetchBranches.withArgs(site).returns(branchesPromise);

      const actual = fixture.createDraftBranch(site, path);

      return actual.then((result) => {
        expect(dispatchSiteBranchesReceivedAction.calledWith(siteId, branches)).to.be.true;
        expect(result).to.equal(draftBranchName);
      });
    });

    it("does nothing when creating a branch fails", () => {
      formatDraftBranchName.withArgs(path).returns(draftBranchName);
      findShaForDefaultBranch.withArgs(site).returns(sha);
      createBranch.withArgs(site, draftBranchName, sha).returns(rejectedWithErrorPromise);

      const actual = fixture.createDraftBranch(site, path);

      expectDispatchToNotBeCalled(actual, dispatchSiteBranchesReceivedAction);
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

  describe("createPR", () => {
    const head = "head";
    const base = "base";
    const pr = {
      go: "team!"
    };

    beforeEach(() => {
      const existingPrs = [{
        head: {
          ref: 'not-head'
        }
      }];
      const prsPromise = Promise.resolve(existingPrs);
      fetchPullRequests.withArgs(site).returns(prsPromise);
    });

    describe('error states', () => {
      it("triggers an error when creating a pull request fails", () => {
        createPullRequest.withArgs(site, head, base).returns(rejectedWithErrorPromise);

        const actual = fixture.createPR(site, head, base);

        return validateResultDispatchesHttpAlertError(actual, errorMessage);
      });

      it("triggers an error when merging a pull request fails", () => {
        const prPromise = Promise.resolve(pr);
        createPullRequest.withArgs(site, head, base).returns(prPromise);
        mergePullRequest.withArgs(site, pr).returns(rejectedWithErrorPromise);

        const actual = fixture.createPR(site, head, base);

        return validateResultDispatchesHttpAlertError(actual, errorMessage);
      });

      it("triggers an error when deleting a branch fails", () => {
        const prPromise = Promise.resolve(pr);
        createPullRequest.withArgs(site, head, base).returns(prPromise);
        mergePullRequest.withArgs(site, pr).returns("whatever");
        deleteBranch.withArgs(site, head).returns(rejectedWithErrorPromise);

        const actual = fixture.createPR(site, head, base);

        return validateResultDispatchesHttpAlertError(actual, errorMessage)
          .then(() => {
            expect(mergePullRequest.calledWith(site, pr)).to.be.true;
          });
      });

      it("triggers an error when fetching a branch fails", () => {
        const prPromise = Promise.resolve(pr);
        createPullRequest.withArgs(site, head, base).returns(prPromise);
        mergePullRequest.withArgs(site, pr).returns("whatever");
        deleteBranch.withArgs(site, head).returns("ignored, too");
        fetchBranches.withArgs(site).throws(error);

        const actual = fixture.createPR(site, head, base);

        return validateResultDispatchesHttpAlertError(actual, errorMessage)
          .then(() => {
            expect(mergePullRequest.calledWith(site, pr)).to.be.true;
            expect(deleteBranch.calledWith(site, head)).to.be.true;
          });
      });
    });

    describe('success states', () => {
      const expected = "expected thing you might want";
      const branches = "branches";
      const siteBranchesReceivedAction = {
        branches: "r us"
      };

      beforeEach(() => {
        mergePullRequest.withArgs(site, pr).returns("whatever");
        deleteBranch.withArgs(site, head).returns("ignored, too");
        fetchBranches.withArgs(site).returns(Promise.resolve(branches));
        alertSuccess.withArgs(`${head} merged successfully`).returns(expected);
      });

      it('does not create a new branch when one exists', () => {
        const existingPrs = [{
          head: {
            ref: 'head'
          }
        }];
        const prsPromise = Promise.resolve(existingPrs);
        fetchPullRequests.withArgs(site).returns(prsPromise);

        const actual = fixture.createPR(site, head, base);

        return actual.then((result) => {
          expect(createPullRequest.calledWith(site, head, base)).to.not.be.true
        });
      });

      it("alerts a successful message and returns it when everything works fine", () => {
        const prPromise = Promise.resolve(pr);
        createPullRequest.withArgs(site, head, base).returns(prPromise);

        const actual = fixture.createPR(site, head, base);

        return actual
          .then((result) => {
            expect(createPullRequest.calledWith(site, head, base)).to.be.true;
            expect(mergePullRequest.calledWith(site, pr)).to.be.true;
            expect(deleteBranch.calledWith(site, head)).to.be.true;
            expect(fetchBranches.calledWith(site)).to.be.true;
            expect(dispatchSiteBranchesReceivedAction.calledWith(siteId, branches)).to.be.true;
            expect(alertSuccess.calledWith(`${head} merged successfully`)).to.be.true;
            expect(result).to.equal(expected);
          });
      });
    });
  });

  describe("fetchSiteConfigsAndAssets", () => {
    describe('site does not exist on github', () => {
      it('dispatches an `invalidSite` and `siteLoading` action', () => {
        const error = {
          name: 'error'
        };
        const promiseRejection = Promise.reject(error);

        siteExists.withArgs(site).returns(promiseRejection);
        getRepo.withArgs(site).returns(promiseRejection)

        const actual = fixture.fetchSiteConfigsAndAssets(site);

        actual.catch(error => {
          expect(dispatchSiteInvalidAction.calledWith(site, true)).to.be.true;
          expect(dispatchSiteLoadingAction.calledWith(site, false)).to.be.true;
          expect(error).to.be.defined;
        });
      });
    });

    describe('site does exist on github', () => {
      it('dispatches a `siteLoading` action', () => {
        stubSuccessChain([
          siteExists,
          getRepo
        ]);

        const actual = fixture.fetchSiteConfigsAndAssets(site);

        actual.then(() => {
          expect(dispatchSiteLoadingAction.calledWith(site, true)).to.be.true;
          expect(dispatchSiteInvalidAction.calledWith(site, true)).to.be.false
        });
      });

      it('dispatches a `siteLoading` action when navigation.json has been requested', () => {
        stubSuccessChain([
          siteExists,
          getRepo,
          fetchSiteNavigationFile
        ]);

        const actual = fixture.fetchSiteConfigsAndAssets(site);

        actual.then(() => {
          expect(dispatchSiteLoadingAction.calledWith(site, false)).to.be.true;
        });
      });

      it("fetches configs, branches, assets, content and does all the things", () => {
        const files = [{
          hi: "there"
        }];

        const sitePromise = Promise.resolve(site);
        const filesPromise = Promise.resolve(files);

        getRepo.withArgs(site).returns(Promise.resolve());
        siteExists.withArgs(site).returns(sitePromise);
        fetchRepositoryConfigs.withArgs(site).returns(sitePromise);
        fetchFile.withArgs(site, '_navigation.json').returns(sitePromise);
        fetchBranches.withArgs(site).returns(sitePromise);
        fetchRepositoryContent.withArgs(site).returns(filesPromise);

        const actual = fixture.fetchSiteConfigsAndAssets(site);

        return actual.then((result) => {
          expect(dispatchSiteConfigsReceivedAction.called).to.be.true
          expect(dispatchSiteLoadingAction.calledWith(site, true)).to.be.true;
          expect(dispatchSiteFilesReceivedAction.calledWith(siteId, files)).to.be.true;
        });
      });
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
