import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("sitesReducer", () => {
  let fixture;
  const SITE_ADDED = "hey, new site!";
  const SITE_ASSETS_RECEIVED = "Whoa. Assets.";
  const SITE_CHILD_CONTENT_RECEIVED = "kids have contents.";
  const SITE_CONFIGS_RECEIVED = "Tasty configs!";
  const SITE_CONTENTS_RECEIVED = "contents? we have contents!";
  const SITE_DELETED = "bye, site.";
  const SITE_UPDATED = "change the site, please";
  const SITES_RECEIVED = "hey, sites!";
  const SITE_FILE_CONTENT_RECEIVED = "cool, files!";

  beforeEach(() => {
    fixture = proxyquire("../../../../assets/app/reducers/sites", {
      "../constants": {
        siteActionTypes: {
          SITE_ADDED: SITE_ADDED,
          SITE_ASSETS_RECEIVED: SITE_ASSETS_RECEIVED,
          SITE_CHILD_CONTENT_RECEIVED: SITE_CHILD_CONTENT_RECEIVED,
          SITE_CONFIGS_RECEIVED: SITE_CONFIGS_RECEIVED,
          SITE_CONTENTS_RECEIVED: SITE_CONTENTS_RECEIVED,
          SITE_DELETED: SITE_DELETED,
          SITE_UPDATED: SITE_UPDATED,
          SITES_RECEIVED: SITES_RECEIVED,
          SITE_FILE_CONTENT_RECEIVED: SITE_FILE_CONTENT_RECEIVED
        }
      }
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
      type: SITE_CONTENTS_RECEIVED,
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
      type: SITE_CONTENTS_RECEIVED,
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
      type: SITE_CONTENTS_RECEIVED,
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
        path: "hey"
      },
      {
        path: "huh?"
      }
    ];

    const actual = fixture(existingSites, {
      type: SITE_CONTENTS_RECEIVED,
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
  
  it("does nothing when given a child contents received action and the new site's id is not found", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = {
      whatever: "punk",
      what: "huh?"
    };

    const actual = fixture(existingSites, {
      type: SITE_CHILD_CONTENT_RECEIVED,
      siteId: "siteToKeepCEOWIOIIJV"
    });

    expect(actual).to.deep.equal(existingSites);
  });

  it("sets a site's 'childDirectoriesMap' property to map the action's path to the action's files when given a child content received action and the new site's id is found, without an existing childDirectoriesMap", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = {
      whatever: "punk",
      what: "huh?"
    };

    const path = "/go/here/or/not";

    const actual = fixture(existingSites, {
      type: SITE_CHILD_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      files: files,
      path: path
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      childDirectoriesMap: {
        "/go/here/or/not": files
      }
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("sets a site's 'childDirectoriesMap' property to map the action's path to the action's files when given a child content received action and the new site's id is found, with an existing childDirectoriesMap", () => {
    const path = "/go/here/or/not";
    const existingPath = "/already/home";
    const existingFiles = [ "previously on something something", "format TBD" ];
    const existingChildDirectoriesMap = { };
    existingChildDirectoriesMap[existingPath] = existingFiles;

    const siteOne = {
      id: "siteToKeep",
      oldData: true,
      childDirectoriesMap: existingChildDirectoriesMap
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [ "whatever", "punk",  "huh?" ];

    const actual = fixture(existingSites, {
      type: SITE_CHILD_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      files: files,
      path: path
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      childDirectoriesMap: {
        "/already/home": existingFiles,
        "/go/here/or/not": files
      }
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("updates a site's 'childDirectoriesMap' property to map the action's path to the action's files when given a child content received action and the new site's id is found, with an existing childDirectoriesMap containing the path", () => {
    const path = "/go/here/or/not";
    const existingFiles = [ "previously on something something", "format TBD" ];
    const existingChildDirectoriesMap = { };
    existingChildDirectoriesMap[path] = existingFiles;

    const siteOne = {
      id: "siteToKeep",
      oldData: true,
      childDirectoriesMap: existingChildDirectoriesMap
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const files = [ "whatever", "punk",  "huh?" ];

    const actual = fixture(existingSites, {
      type: SITE_CHILD_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      files: files,
      path: path
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      childDirectoriesMap: {
        "/go/here/or/not": files
      }
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("sets a site's 'childDirectoriesMap' property to map the action's path to an empty array when given a child content received action and the new site's id is found... and the action doesn't have a files attribute", () => {
    const siteOne = {
      id: "siteToKeep",
      oldData: true
    };

    const siteTwo = {
      id: "anotherSiteToKeep",
      oldData: true
    };

    const existingSites = [ siteOne, siteTwo ];

    const path = "/go/here/or/not";

    const actual = fixture(existingSites, {
      type: SITE_CHILD_CONTENT_RECEIVED,
      siteId: "siteToKeep",
      path: path
    });

    const updatedSiteOne = {
      id: "siteToKeep",
      oldData: true,
      childDirectoriesMap: {
        "/go/here/or/not": []
      }
    };

    expect(actual).to.deep.equal([ updatedSiteOne, siteTwo ]);
  });

  it("updates a site's file with a content attribute if it is found", function() {
    const fileSha = "this is a cool sha";
    const fileContent = "yo dude, here's some content";
    const siteOne = {
      id: "siteToKeep",
      files: [
        {
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

});
