import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("assetsReducer", () => {
  let fixture;
  const SITE_ASSETS_RECEIVED = "hey, assets!";
  
  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./constants": {
        siteActionTypes: {
          SITE_ASSETS_RECEIVED: SITE_ASSETS_RECEIVED
        }
      }
    }).assets;
  });

  it("defaults to empty array and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: "alijasfjir"
    });

    expect(actual).to.deep.equal([]);
  });

  it("appends data to empty state", () => {
    const SITE_1 = "site one";
    const URL_1 = "url one";
    const URL_2 = "url two";
    
    const assets = [{ url: URL_1 }, { url: URL_2 }];
        
    const actual = fixture([], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_1
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_1
    }, {
      site: SITE_1,
      url: URL_2
    }]);
  });

  it("appends data to state when there's no overlap in the new data", () => {
    const SITE_1 = "site one";
    const URL_1 = "url one";
    const URL_2 = "url two";
    
    const assets = [{ url: URL_1 }];
        
    const actual = fixture([{ site: SITE_1, url: URL_2 }], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_1
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_2
    }, {
      site: SITE_1,
      url: URL_1
    }]);
  });

  it("appends data to state unless there's overlap in the new data", () => {
    const SITE_1 = "site one";
    const URL_1 = "url one";
    const REPEAT_URL_1 = "url one";
    
    const assets = [{ url: REPEAT_URL_1 }];
        
    const actual = fixture([{ site: SITE_1, url: URL_1 }], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_1
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_1
    }]);
  });

  
  it("IS THIS A BUG??? does not append data to state if a site has an overlap in urls", () => {
    const SITE_1 = "site one";
    const SITE_2 = "site two";
    const URL_1 = "url one";
    const REPEAT_URL_1 = "url one";
    
    const assets = [{ url: REPEAT_URL_1 }];
        
    const actual = fixture([{ site: SITE_1, url: URL_1 }], {
      type: SITE_ASSETS_RECEIVED,
      assets: assets,
      siteId: SITE_2
    });

    expect(actual).to.deep.equal([{
      site: SITE_1,
      url: URL_1
    }]);
  });
});

describe("buildsReducer", () => {
  let fixture;
  const BUILDS_RECEIVED = "builds received!";
  
  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./constants": {
        buildActionTypes: {
          BUILDS_RECEIVED: BUILDS_RECEIVED
        }
      }
    }).builds;
  });

  it("ignores other actions and defaults to an empty array", () => {
    const BUILDS = [ "build a", "build b" ];
    
    const actual = fixture(undefined, {
      type: "Ignore me because I am not the one",
      builds: BUILDS
    });

    expect(actual).to.deep.equal([]);
  });

  it("records the builds received in the action", () => {
    const BUILDS = [ "build a", "build b" ];
    
    const actual = fixture([], {
      type: BUILDS_RECEIVED,
      builds: BUILDS
    });

    expect(actual).to.deep.equal(BUILDS);
  });

  it("overrides with the builds received in the action", () => {
    const BUILDS = [ "build a", "build b" ];
    
    const actual = fixture(["build z"], {
      type: BUILDS_RECEIVED,
      builds: BUILDS
    });

    expect(actual).to.deep.equal(BUILDS);
  });
});

describe("errorReducer", () => {
  let fixture;
  const HTTP_ERROR = "errant HTTP";
  
  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./constants": {
        errorActionTypes: {
          HTTP_ERROR: HTTP_ERROR
        }
      }
    }).error;
  });

  it("defaults to an empty string error and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not the error",
      hello: "world"
    });

    expect(actual).to.equal("");
  });

  it("keeps track of an error", () => {
    const SOME_ERROR = "HTTP 418";
    
    const actual = fixture("", {
      type: HTTP_ERROR,
      error: SOME_ERROR
    });

    expect(actual).to.equal(SOME_ERROR);
  });

  it("overrides an existing error", () => {
    const SOME_ERROR = "HTTP 418";
    
    const actual = fixture("Very Gruntled!", {
      type: HTTP_ERROR,
      error: SOME_ERROR
    });

    expect(actual).to.equal(SOME_ERROR);
  });
});

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
  
  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./constants": {
        siteActionTypes: {
          SITE_ADDED: SITE_ADDED,
          SITE_ASSETS_RECEIVED: SITE_ASSETS_RECEIVED,
          SITE_CHILD_CONTENT_RECEIVED: SITE_CHILD_CONTENT_RECEIVED,
          SITE_CONFIGS_RECEIVED: SITE_CONFIGS_RECEIVED,
          SITE_CONTENTS_RECEIVED: SITE_CONTENTS_RECEIVED,
          SITE_DELETED: SITE_DELETED,
          SITE_UPDATED: SITE_UPDATED,
          SITES_RECEIVED: SITES_RECEIVED
        }
      }
    }).sites;
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

    const files = {
      whatever: "punk",
      what: "huh?"
    };
    
    const actual = fixture(existingSites, {
      type: SITE_CONTENTS_RECEIVED,
      siteId: "siteToKeepCEOWIOIIJV",
      files: files
    });

    expect(actual).to.deep.equal(existingSites);    
  });

  it("sets a site's 'files' property when given a contents received action and the new site's id is found", () => {
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

  it("sets a site's 'childDirectoriesMap' property to map the action's path to the action's files when given a child content received action and the new site's id is found and the state doesn't have a root childDirectoriesMap (however that's assigned because it looks like that never happens)", () => {
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

  it("sets a site's 'childDirectoriesMap' property to map the action's path to an empty array when given a child content received action and the new site's id is found and the state doesn't have a root childDirectoriesMap (however that's assigned because it looks like that never happens)... and the action doesn't have a files attribute", () => {
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

});


describe("userReducer", () => {
  let fixture;
  const USER_RECEIVED = "hi, user!";
  
  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./constants": {
        userActionTypes: {
          USER_RECEIVED: USER_RECEIVED
        }
      }
    }).user;
  });

  it("defaults to false and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: "alijasfjir"
    });

    expect(actual).to.be.false;
  });

  it("records lots of data from the user received action, overwriting what's there", () => {
    const user = {
      id: 12,
      username: "bob",
      email: "no-email@nothingtoseeheresopleasego.org",
      passports: [ "what is this?", "good question."],
      createdAt: "Monday morning.",
      updatedAt: "Thursday, late in the afternoon."
    };
    
    const actual = fixture({ anything: "goes here" }, {
      type: USER_RECEIVED,
      user: user
    });

    expect(actual).to.deep.equal(user);
  });
});
