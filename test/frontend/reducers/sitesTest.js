import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("sitesReducer", () => {
  let fixture;
  const SITE_ADDED = "hey, new site!";
  const SITE_DELETED = "bye, site.";
  const SITE_UPDATED = "change the site, please";
  const SITES_RECEIVED = "hey, sites!";
  const BUILD_RESTARTED = "build restarted!"

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/sites", {
      "../actions/actionCreators/siteActions": {
        sitesReceivedType: SITES_RECEIVED,
        siteAddedType: SITE_ADDED,
        siteUpdatedType: SITE_UPDATED,
        siteDeletedType: SITE_DELETED,
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
});
