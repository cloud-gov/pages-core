import { expect } from 'chai';
import proxyquire from 'proxyquire';

import siteReducer from '../../../frontend/reducers/sites';

proxyquire.noCallThru();

describe('sitesReducer', () => {
  let fixture;
  const SITES_FETCH_STARTED = '🐶⚾️';
  const SITE_ADDED = 'hey, new site!';
  const SITE_DELETED = 'bye, site.';
  const SITE_UPDATED = 'change the site, please';
  const SITE_BRANCHES_RECEIVED = 'branches received';
  const SITES_RECEIVED = 'hey, sites!';
  const BUILD_RESTARTED = 'build restarted!';
  const SITE_USER_ADDED = 'site user added';
  const SITE_USER_REMOVED = 'SITE_USER_REMOVED';
  const SET_CURRENT_SITE = 'SET_CURRENT_SITE';
  const SITE_BASIC_AUTH_SAVED = 'SITE_BASIC_AUTH_SAVED';
  const SITE_BASIC_AUTH_REMOVED = 'SITE_BASIC_AUTH_REMOVED';
  const initialState = {
    isLoading: false,
    data: [],
  };

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/sites', {
      '../actions/actionCreators/siteActions': {
        sitesFetchStartedType: SITES_FETCH_STARTED,
        sitesReceivedType: SITES_RECEIVED,
        siteAddedType: SITE_ADDED,
        siteUpdatedType: SITE_UPDATED,
        siteBranchesReceivedType: SITE_BRANCHES_RECEIVED,
        siteDeletedType: SITE_DELETED,
        siteUserAddedType: SITE_USER_ADDED,
        siteBasicAuthSavedType: SITE_BASIC_AUTH_SAVED,
        siteBasicAuthRemovedType: SITE_BASIC_AUTH_REMOVED,
      },
      '../actions/actionCreators/buildActions': {
        buildRestartedType: BUILD_RESTARTED,
      },
    }).default;
  });

  it('defaults to an initial state and ignores other actions', () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: 'alijasfjir',
    });

    expect(actual).to.deep.equal(initialState);
  });

  it("marks the state as loading when it gets a 'sites fetch started' action", () => {
    const actual = fixture(initialState, {
      type: SITES_FETCH_STARTED,
    });

    expect(actual).to.deep.equal({ ...initialState, isLoading: true });
  });

  it("replaces anything it has when it gets a 'sites received' action", () => {
    const sites = [{ hello: 'world' }, { how: 'are you?' }];

    const actual = fixture({ ...initialState, data: [{ oldData: 'to be lost' }] }, {
      type: SITES_RECEIVED,
      sites,
    });

    expect(actual).to.deep.equal({ ...initialState, isLoading: false, data: sites });
  });


  it("ignores a malformed 'sites received' action", () => {
    const state = { ...initialState, data: [{ oldData: 'to be there' }] };
    const actual = fixture(state, {
      type: SITES_RECEIVED,
    });

    expect(actual).to.deep.equal(state);
  });

  it('adds a site if action has a site', () => {
    const existingSites = [{ existing: 'siteToKeep' }];
    const site = { hereIs: 'something' };

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_ADDED,
      site,
    });

    expect(actual.data).to.deep.equal(existingSites.concat(site));
  });

  it('does not add a site if action has no site', () => {
    const existingSites = [{ existing: 'siteToKeep' }];

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_ADDED,
    });

    expect(actual.data).to.deep.equal(existingSites);
  });

  it("ignores when given an update action and the new site's id is not found", () => {
    const existingSites = [{
      id: 'siteToKeep',
      oldData: true,
    }, {
      id: 'anotherSiteToKeep',
      oldData: true,
    }];

    const site = { id: 'something', oldData: false };

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_UPDATED,
      siteId: 'something',
      site,
    });

    expect(actual.data).to.deep.equal(existingSites);
  });

  it("updates existing site data when given an update action and the new site's id is found", () => {
    const siteOne = {
      id: 'siteToKeep',
      oldData: true,
    };

    const siteTwo = {
      id: 'anotherSiteToKeep',
      oldData: true,
    };

    const existingSites = [siteOne, siteTwo];

    const newSite = { id: 'siteToKeep', oldData: false, hi: 'there' };

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_UPDATED,
      siteId: 'siteToKeep',
      site: newSite,
    });

    expect(actual.data).to.deep.equal([newSite, siteTwo]);
  });

  it('sets existing site branches when SITE_BRANCHES_RECEIVED', () => {
    const site = {
      id: 23,
      branches: ['flower'],
    };

    const newBranches = ['pencil', 'beer'];
    const actual = fixture({ isLoading: false, data: [site] }, {
      type: SITE_BRANCHES_RECEIVED,
      siteId: site.id,
      branches: newBranches,
    });

    expect(actual.data).to.deep.equal([
      {
        id: site.id,
        branches: newBranches,
      },
    ]);
  });

  it('ignores delete request if site id is not found', () => {
    const siteOne = {
      id: 'siteToKeep',
      oldData: true,
    };

    const siteTwo = {
      id: 'anotherSiteToKeep',
      oldData: true,
    };

    const existingSites = [siteOne, siteTwo];

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_DELETED,
      siteId: "i'm not here.",
    });

    expect(actual.data).to.deep.equal(existingSites);
  });

  it('deletes site if site id is found', () => {
    const siteToLoseId = 'site to lose';

    const siteOne = {
      id: 'siteToKeep',
      oldData: true,
    };

    const siteTwo = {
      id: siteToLoseId,
      oldData: true,
    };

    const existingSites = [siteOne, siteTwo];

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_DELETED,
      siteId: siteToLoseId,
    });

    expect(actual.data).to.deep.equal([siteOne]);
  });

  it('adds site to state\'s data when SITE_USER_ADDED', () => {
    const siteAdded = { id: 55 };
    const actual = fixture({ isLoading: false, data: [] }, {
      type: SITE_USER_ADDED,
      site: siteAdded,
    });

    expect(actual.isLoading).to.be.false;
    expect(actual.data).to.deep.equal([siteAdded]);
  });

  it('returns existing state when SITE_USER_ADDED if action has no site', () => {
    const actual = fixture({ isLoading: false, data: [] }, {
      type: SITE_USER_ADDED,
    });

    expect(actual.isLoading).to.be.false;
    expect(actual.data).to.deep.equal([]);
  });

  it('returns existing state with removed user information on SITE_USER_REMOVED', () => {
    const oldSite = {
      id: 1,
      owner: 'person1',
      repository: 'a',
      users: [{ username: 'james' }, { username: 'jane' }],
    };

    const state = {
      isLoading: false,
      data: [
        oldSite, {
          id: 2, owner: 'person2', repository: 'b', users: [],
        },
      ],
    };
    const updatedSite = { ...oldSite, users: [{ username: 'jane' }] };
    const actual = siteReducer(state, { type: SITE_USER_REMOVED, site: updatedSite });

    expect(actual.data.length).to.equal(2);
    expect(actual.data[0].users[0].username).to.equal('jane');
    expect(actual.data[1]).to.deep.equal(state.data[1]);
  });

  it("updates existing site data when given an save basic auth action and the new site's id is found", () => {
    const siteOne = {
      id: 'siteToKeep',
      oldData: true,
    };

    const siteTwo = {
      id: 'anotherSiteToKeep',
      oldData: true,
    };

    const existingSites = [siteOne, siteTwo];

    const newSite = { id: 'siteToKeep', oldData: false, hi: 'there', basicAuth: { username: 'username', password: 'password' } };

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_BASIC_AUTH_SAVED,
      siteId: 'siteToKeep',
      site: newSite,
    });

    expect(actual.data).to.deep.equal([newSite, siteTwo]);
  });

  it("updates existing site data when given an save basic auth action and the new site's id is found", () => {
    const siteOne = {
      id: 'siteToKeep',
      oldData: true,
      basicAuth: { username: 'username', password: 'password' },
    };

    const siteTwo = {
      id: 'anotherSiteToKeep',
      oldData: true,
    };

    const existingSites = [siteOne, siteTwo];

    const newSite = { id: 'siteToKeep', oldData: false, hi: 'there', basicAuth: {} };

    const actual = fixture({ isLoading: false, data: existingSites }, {
      type: SITE_BASIC_AUTH_REMOVED,
      siteId: 'siteToKeep',
      site: newSite,
    });

    expect(actual.data).to.deep.equal([newSite, siteTwo]);
  });
});
