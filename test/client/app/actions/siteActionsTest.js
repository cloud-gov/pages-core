import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("siteActions", () => {
  let fixture;
  let dispatch, httpErrorAlertAction, fetchSites, addSite, updateSite, deleteSite, fetchRepositoryContent,
      fetchRepositoryConfigs, createCommit, encodeB64, alertSuccess;
  const SITES_RECEIVED = "sites received, bucko";
  const SITE_ADDED = "site added, bucko";
  const SITE_UPDATED = "site updated";
  const SITE_DELETED = "site deleted nothing to see here";
  const SITE_FILES_RECEIVED = "site files received";
  const SITE_FILE_CONTENT_RECEIVED = "site file content received, if you say so";
  const SITE_CONFIGS_RECEIVED = "my kingdom for a config!";
  const SITE_FILE_ADDED = "site file added";
  const SITE_ASSETS_RECEIVED = "i have an asset or two for you to peruse";
  
  const UPDATE_ROUTER = "main router turn on";
  
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
    
    // FIXME: complex dependency wiring a smell
    fixture = proxyquire("../../../../assets/app/actions/siteActions", {
      "../constants": {
        siteActionTypes: {
          SITES_RECEIVED: SITES_RECEIVED,
          SITE_ADDED: SITE_ADDED,
          SITE_UPDATED: SITE_UPDATED,
          SITE_DELETED: SITE_DELETED,
          SITE_FILES_RECEIVED: SITE_FILES_RECEIVED,
          SITE_FILE_CONTENT_RECEIVED: SITE_FILE_CONTENT_RECEIVED,
          SITE_CONFIGS_RECEIVED: SITE_CONFIGS_RECEIVED,
          SITE_FILE_ADDED: SITE_FILE_ADDED,
          SITE_ASSETS_RECEIVED: SITE_ASSETS_RECEIVED
        },
        navigationTypes: {
          UPDATE_ROUTER: UPDATE_ROUTER
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

  it("triggers the fetching of sites and dispatches a sites received action to the store when successful", () => {
    const sites = {
      hi: "mom"
    };
    const sitesPromise = Promise.resolve(sites);
    fetchSites.withArgs().returns(sitesPromise);

    const actual = fixture.fetchSites();
    
    return actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITES_RECEIVED,
        sites
      })).to.be.true;
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

  it("triggers the adding of a site and dispatches site added and update router actions to the store when successful", () => {
    const siteToAdd = {
      hey: "you"
    };
    const site = {
      hi: "mom"
    };
    const sitePromise = Promise.resolve(site);
    addSite.withArgs(siteToAdd).returns(sitePromise);

    const actual = fixture.addSite(siteToAdd);
    
    return actual.then(() => {
      expect(dispatch.callCount).to.equal(2);

      // FIXME: this seems super coupled.
      expect(dispatch.calledWith({
        type: SITE_ADDED,
        site
      }));
      expect(dispatch.calledWith({
        type: UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites`]
      }));
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
    const sitePromise = Promise.resolve(site);
    updateSite.withArgs(siteToUpdate, data).returns(sitePromise);

    const actual = fixture.updateSite(siteToUpdate, data);
    
    return actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_UPDATED,
        siteId: id,
        site
      })).to.be.true;
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
  
  it("triggers the deletion of a site and dispatches a site deleted update router actions to the store when successful", () => {
    const siteId = "fohjf892unsfkgh3874t249ofmlsfjngu";
    const site = {
      completely: "ignored"
    };
    const sitePromise = Promise.resolve(site);
    deleteSite.withArgs(siteId).returns(sitePromise);

    const actual = fixture.deleteSite(siteId);
    
    return actual.then(() => {
      expect(dispatch.callCount).to.equal(2);

      // FIXME: this seems super coupled.
      expect(dispatch.calledWith({
        type: SITE_DELETED,
        siteId
      }));
      expect(dispatch.calledWith({
        type: UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites`]
      }));
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

    const actual = fixture.fetchFiles(site, path);
    
    return actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_FILES_RECEIVED,
        siteId: id,
        files
      })).to.be.true;
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
    fetchRepositoryContent.withArgs(site, path).returns(filePromise);

    const actual = fixture.fetchFileContent(site, path);
    
    return actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_FILE_CONTENT_RECEIVED,
        siteId: id,
        file
      })).to.be.true;
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

  it("creates a commit with the default message and no sha and dispatches a site file added action to the store when successful", () => {
    // FIXME: this is a particularly complicated test whose creation comes very directly
    // from looking at the implementation. Neither of those are good things.
    const id = "kuaw8fsru8hwugfw";
    const site = {
      id: id,
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
      message: `Adds ${path} to project`,
      content: encodedContent
    };
    createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

    const actual = fixture.createCommit(site, path, content);
    
    return actual.then(() => {
      expect(alertSuccess.calledWith("File added successfully")).to.be.true;
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_FILE_ADDED,
        siteId: id,
        file: content
      })).to.be.true;
    });    
  });
  
  it("creates a commit with the specified message and no sha and dispatches a site file added action to the store when successful", () => {
    // FIXME: this is a particularly complicated test whose creation comes very directly
    // from looking at the implementation. Neither of those are good things.
    const message = "twinkle twinkle little star";
    const id = "kuaw8fsru8hwugfw";
    const site = {
      id: id,
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
      message: message,
      content: encodedContent
    };
    createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

    const actual = fixture.createCommit(site, path, content, message);
    
    return actual.then(() => {
      expect(alertSuccess.calledWith("File added successfully")).to.be.true;
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_FILE_ADDED,
        siteId: id,
        file: content
      })).to.be.true;
    });    
  });

  it("creates a commit with the default message and a sha and dispatches a site file added action to the store when successful", () => {
    // FIXME: this is a particularly complicated test whose creation comes very directly
    // from looking at the implementation. Neither of those are good things.
    const sha = "euvuhvauy2498u0294fjerhv98ewyg0942jviuehgiorefjhviofdsjv";
    const id = "kuaw8fsru8hwugfw";
    const site = {
      id: id,
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
      message: `Adds ${path} to project`,
      content: encodedContent,
      sha: sha
    };
    createCommit.withArgs(site, path, expectedCommit).returns(commitObjectPromise);

    const actual = fixture.createCommit(site, path, content, false, sha);
    
    return actual.then(() => {
      expect(alertSuccess.calledWith("File added successfully")).to.be.true;
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_FILE_ADDED,
        siteId: id,
        file: content
      })).to.be.true;
    });    
  });
  
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
    fetchRepositoryContent.withArgs(site, "assets").returns(assetsPromise);

    const actual = fixture.fetchSiteAssets(site);
    
    return actual.then((result) => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_ASSETS_RECEIVED,
        siteId: id,
        assets: [ bAsset ]
      })).to.be.true;
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
    fetchRepositoryContent.withArgs(site, assetPath).returns(assetsPromise);

    const actual = fixture.fetchSiteAssets(site);
    
    return actual.then((result) => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith({
        type: SITE_ASSETS_RECEIVED,
        siteId: id,
        assets: [ bAsset ]
      })).to.be.true;
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

  const dispatchesAnAlertError = (errorMessage) => {
    expect(dispatch.called).to.be.false;
    expect(httpErrorAlertAction.calledWith(errorMessage)).to.be.true;
  };
});
