import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("sitesReducer", () => {
  let fixture;
  const SITE_ADDED = "hey, new site!";
  const SITE_ASSETS_RECEIVED = "Whoa. Assets.";
  const SITE_CONFIGS_RECEIVED = "Tasty configs!";
  const SITE_DELETED = "bye, site.";
  const SITE_UPDATED = "change the site, please";
  const SITES_RECEIVED = "hey, sites!";
  const SITE_FILE_CONTENT_RECEIVED = "cool files!";
  const SITE_UPLOAD_RECEIVED = 'uploaded!';
  const SITE_FILES_RECEIVED = "contents? we have contents!";
  const BUILD_RESTARTED = "build restarted!"

  beforeEach(() => {
    fixture = proxyquire("../../../../assets/app/reducers/sites", {
      "../constants": {
        siteActionTypes: {
          SITE_UPLOAD_RECEIVED: SITE_UPLOAD_RECEIVED
        }
      },
      "../actions/actionCreators/siteActions": {
        sitesReceivedType: SITES_RECEIVED,
        siteAddedType: SITE_ADDED,
        siteUpdatedType: SITE_UPDATED,
        siteDeletedType: SITE_DELETED,
        siteFileContentReceivedType: SITE_FILE_CONTENT_RECEIVED,
        siteAssetsReceivedType: SITE_ASSETS_RECEIVED,
        siteConfigsReceivedType: SITE_CONFIGS_RECEIVED,
        siteFilesReceivedType: SITE_FILES_RECEIVED
      },
      "../actions/actionCreators/buildActions": {
        buildRestartedType: BUILD_RESTARTED,
      },
    }).default;
  });

  it("defaults to empty array and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: "alijasfjir"
    });

    expect(actual).to.deep.equal([]);
  });

  it("replaces anything it has when it gets a 'sites received' action", () => {
    const sites = [{ hello: "world"}, { how: "are you?" }];

    const actual = fixture([{ oldData: "to be lost" }], {
      type: SITES_RECEIVED,
      sites: sites
    });

    expect(actual).to.deep.equal(sites);
  });


  it("ignores a malformed 'sites received' action", () => {
    const sites = [{ hello: "world"}, { how: "are you?" }];

    const actual = fixture([{ oldData: "to be lost" }], {
      type: SITES_RECEIVED
    });

    expect(actual).to.deep.equal([]);
  });

  it("adds a site if action has a site", () => {
    const existingSites = [{ existing: "siteToKeep" }];
    const site = { hereIs: "something" };

    const actual = fixture(existingSites, {
      type: SITE_ADDED,
      site: site
    });

    expect(actual).to.deep.equal(existingSites.concat(site));
  });

  it("does not add a site if action has no site", () => {
    const existingSites = [{ existing: "siteToKeep" }];
    const site = { hereIs: "something" };

    const actual = fixture(existingSites, {
      type: SITE_ADDED
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("ignores when given an update action and the new site's id is not found", () => {
    const existingSites = [{
      id: "siteToKeep",
      oldData: true
    }, {
      id: "anotherSiteToKeep",
      oldData: true
    }];

    const site = { id: "something", oldData: false };

    const actual = fixture(existingSites, {
      type: SITE_UPDATED,
      siteId: "something",
      site: site
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("updates existing site data when given an update action and the new site's id is found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const newSite = { id: "siteToKeep", oldData: false, hi: "there" };

    const actual = fixture(existingSites, {
      type: SITE_UPDATED,
      siteId: "siteToKeep",
      site: newSite
    });

    expect(actual).to.deep.equal([ newSite, siteTwo ]);
  });

  it("ignores delete request if site id is not found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const actual = fixture(existingSites, {
      type: SITE_DELETED,
      siteId: "i'm not here."
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("deletes site if site id is found", () => {
    const siteToLoseId = "site to lose";

    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: siteToLoseId,
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const actual = fixture(existingSites, {
      type: SITE_DELETED,
      siteId: siteToLoseId
    });

    expect(actual).to.deep.equal([ siteOne ]);
  });

  it("does nothing with configs if site not found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const actual = fixture(existingSites, {
      type: SITE_CONFIGS_RECEIVED,
      siteId: "i'm not here."
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("updates existing site's data arbitrarily like update does when given a config action and the new site's id is found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const configs = {
      whatever: "punk",
      what: "huh?"
    };

    const actual = fixture(existingSites, {
      type: SITE_CONFIGS_RECEIVED,
      siteId: "siteToKeep",
      configs: configs
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      whatever: "punk",
      what: "huh?"
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("does nothing when given an assets received action and the new site's id is not found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const assets = {
      whatever: "punk",
      what: "huh?"
    };

    const actual = fixture(existingSites, {
      type: SITE_ASSETS_RECEIVED,
      siteId: "siteToKeepCEOWIOIIJV",
      assets: assets
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("sets a site's 'assets' property when given an assets received action and the new site's id is found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const assets = {
      whatever: "punk",
      what: "huh?"
    };

    const actual = fixture(existingSites, {
      type: SITE_ASSETS_RECEIVED,
      siteId: "siteToKeep",
      assets: assets
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      assets: assets
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it('adds an uploaded file to the site\'s assets array when the site is found', () => {
    const siteId = 'site-id';
    const existingFile = {
      id: 'old-file'
    };
    const existingSites = [
      {
        id: siteId,
        assets: [existingFile]
      }
    ];
    const actual = fixture(existingSites, {
      type: SITE_UPLOAD_RECEIVED,
      siteId: siteId,
      file: { id: 'uploaded-file' }
    });

    const siteAssets = actual[0].assets;

    expect(siteAssets.length).to.equal(2);
    expect(siteAssets[1].id).to.equal('uploaded-file');
  });

  it("does nothing when given a contents received action and the new site's id is not found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [
      {
        whatever: "punk"
      },
      {
        what: "huh?"
      }
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeepCEOWIOIIJV",
      files: files
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("sets a site's 'files' property when given a contents received action and the new site's id is found and it does not yet have a 'files' value", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [
      {
        whatever: "punk"
      },
      {
        what: "huh?"
      }
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeep",
      files: files
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      files: files
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("adds files to a site's 'files' property when given a contents received action and the new site's id is found and it already has some files", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true,
      files: [
        {
          path: "hey"
        }
      ]
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [
      {
        path: "punk"
      },
      {
        path: "huh?"
      }
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeep",
      files: files
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      files: siteOne.files.concat(files)
    };

    const site = actual.find((s) => s.id === updatedSiteOne.id);

    expect(actual.length).to.equal(2);
    expect(site.files.length).to.equal(updatedSiteOne.files.length);
  });

  it("adds files to a site's 'files' property when given a contents received action and the new site's id is found and it already has some files, one of which matches the action's path", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true,
      files: [
        {
          path: "hey",
          url: 'http://url.biz?ref=master'
        }
      ]
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [
      {
        path: "hey",
        url: 'http://url.biz?ref=master'
      },
      {
        path: "huh?",
        url: 'http://url.biz?ref=master'
      }
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeep",
      files: files
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      files: files
    };

    const site = actual.find((s) => s.id === updatedSiteOne.id);

    expect(actual.length).to.equal(2);
    expect(site.files.length).to.equal(updatedSiteOne.files.length);
  });

  it('does not update a file when receiving a file with the same path, but different branch ref', () => {
    const initialContent = 'who is dankey kang?';
    const sites = [
      {
        id: 1,
        files: [
          {
            path: 'file_path.md',
            url: 'http://biz.biz?ref=master',
            content: initialContent
          }
        ]
      }
    ];

    const nextFile = {
      path: 'file_path.md',
      url: 'http://biz.biz?ref=draft',
      content: 'hello world'
    }

    const actual = fixture(sites, {
      type: SITE_FILES_RECEIVED,
      siteId: 1,
      files: [nextFile]
    });

    const nextSite = actual[0];

    expect(nextSite.files[0].content).to.equal(initialContent);
  });

  it("does nothing when given a files_received action and the new site's id is not found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [
      {path: "punk"},
      {path: "huh?"}
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeepCEOWIOIIJV"
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("returns files from action if no files are set on site", () => {
    const siteOne = {
      id: "siteToKeep"
    };

    const siteTwo = {
      id: "anotherSiteToKeep"
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [
      {path: "punk"},
      {path: "huh?"}
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeep",
      files: files
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      files: files
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("returns a new files array with the union of the new and existing files", () => {
    const existingFiles = [
      { path: "previously on something something" },
      { path: "format TBD" }
    ];

    const siteOne = {
      id: "siteToKeep",
      files: existingFiles
    };

    const siteTwo = {
      id: "anotherSiteToKeep"
    };

    const existingSites = [ siteOne, siteTwo ];

    const newFiles = [
      {path: "punk"},
      {path: "huh?"}
    ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeep",
      files: newFiles
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      files: existingFiles.concat(newFiles)
    };

    const actualSiteOne = actual.find((site) => site.id === siteOne.id);

    expect(actualSiteOne.files.length).to.equal(updatedSiteOne.files.length);
  });

  it("returns an empty array if action.files is missing and site has no files", () => {
    const siteOne = {
      id: "siteToKeep"
    };

    const siteTwo = {
      id: "anotherSiteToKeep"
    };

    const existingSites = [ siteOne, siteTwo ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: "siteToKeep"
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      files: []
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("returns site's exisiting files if action.files is missing and site has files", () => {
    const siteOne = {
      id: 1,
      files: [{path: 'test'}]
    };

    const siteTwo = {
      id: 2
    };

    const existingSites = [ siteOne, siteTwo ];

    const actual = fixture(existingSites, {
      type: SITE_FILES_RECEIVED,
      siteId: 1
    });

    expect(actual).to.deep.equal(existingSites)
  });

  it("updates a site's file with a content attribute if it is found", function() {
    const fileSha = "this is a cool sha";
    const fileContent = "yo dude, here's some content";
    const siteOne = {
      id: "siteToKeep",
      files: [
        {
          path: 'radpath',
          sha: fileSha,
          oldData: "this should make it all the way through"
        }
      ]
    };

    const existingSites = [ siteOne ];

    const actual = fixture(existingSites, {
      type: SITE_FILE_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      file: {
        path: 'radpath',
        sha: fileSha,
        content: fileContent
      }
    });

    const expectedFile = Object.assign({}, siteOne.files.pop(), {
      content: fileContent
    });

    expect(actual.pop().files.pop()).to.deep.equal(expectedFile);
  });

  it("sets a site's files to match the specified params if the site has no files at all", function() {
    const fileSha = "this is a cool sha";
    const fileContent = "yo dude, here's some content";
    const siteOne = {
      id: "siteToKeep"
    };

    const existingSites = [ siteOne ];

    const actual = fixture(existingSites, {
      type: SITE_FILE_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      file: {
        sha: fileSha,
        content: fileContent
      }
    });

    expect(actual).to.deep.equal([{
      id: "siteToKeep",
      files: [{
        sha: fileSha,
        content: fileContent
      }]
    }]);
  });

  it("updates a site's file with a content attribute if its matching path is found, leaving unmatched files for the site unchanged", function() {
    const fileSha = "this is a cool sha";
    const revisedFileSha = "this is an even more cool sha";
    const otherSha = "this sha is less cool";
    const fileContent = "yo dude, here's some content";
    const pathOne = "/here/is/path/one";
    const pathTwo = "/here/is/path/two";

    const fileOne = {
      sha: fileSha,
      path: pathOne,
      oldData: "this should make it all the way through"
    };
    const fileTwo = {
      sha: otherSha,
      path: pathTwo,
      moreData: "hi, bub."
    };

    const siteOne = {
      id: "siteToKeep",
      files: [ fileOne, fileTwo ]
    };

    const existingSites = [ siteOne ];

    const actual = fixture(existingSites, {
      type: SITE_FILE_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      file: {
        sha: revisedFileSha,
        path: pathOne,
        content: fileContent
      }
    });

    expect(actual).to.deep.equal([{
      id: "siteToKeep",
      files: [ {
        sha: revisedFileSha,
        path: pathOne,
        oldData: "this should make it all the way through",
        content: fileContent
      }, fileTwo ]
    }]);
  });

  it("adds a file to a site if it is not found in the state when the request for content comes back from the github api", function() {
    const file = {
      path: 'path/to/file',
      sha: "this is a cool sha",
      content: "yo dude, here's some content"
    }
    const siteOne = {
      id: "siteToKeep",
      files: []
    };

    const existingSites = [ siteOne ];

    const actual = fixture(existingSites, {
      type: SITE_FILE_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      file
    });

    expect(actual.pop().files.pop()).to.deep.equal(file);
  });

  it("adds the restarted build in the action to its site", () => {
    const sitePendingRestart = {
      id: "pick this one",
      builds: ["finished build"],
    };
    const otherSite = {
      id: "not this one",
    };
    const build = {
      site: sitePendingRestart,
    };
    const restartedSite = Object.assign({}, sitePendingRestart, {
      builds: [build, ...sitePendingRestart.builds],
    });

    const actual = fixture([sitePendingRestart, otherSite], {
      type: BUILD_RESTARTED,
      build: build
    });

    expect(actual).to.deep.equal([restartedSite, otherSite])
  });

});
