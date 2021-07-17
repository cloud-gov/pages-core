import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('organizationsReducer', () => {
  let fixture;
  const ORGANIZATIONS_FETCH_STARTED = '🐶⚾️';
  const ORGANIZATIONS_RECEIVED = 'branches received';
  const initialState = {
    isLoading: false,
    data: [],
  };

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/organizations', {
      '../actions/actionCreators/organizationActions': {
        organizationsFetchStartedType: ORGANIZATIONS_FETCH_STARTED,
        organizationsReceivedType: ORGANIZATIONS_RECEIVED,
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

  it("marks the state as loading when it gets a 'organizations fetch started' action", () => {
    const actual = fixture(initialState, {
      type: ORGANIZATIONS_FETCH_STARTED,
    });

    expect(actual).to.deep.equal({ ...initialState, isLoading: true });
  });

  it("replaces anything it has when it gets a 'organizations received' action", () => {
    const organizations = [{ hello: 'world' }, { how: 'are you?' }];

    const actual = fixture({ ...initialState, data: [{ oldData: 'to be lost' }] }, {
      type: ORGANIZATIONS_RECEIVED,
      organizations,
    });

    expect(actual).to.deep.equal({ ...initialState, isLoading: false, data: organizations });
  });

  it("ignores a malformed 'organizations received' action", () => {
    const state = { ...initialState, data: [{ oldData: 'to be there' }] };
    const actual = fixture(state, {
      type: ORGANIZATIONS_RECEIVED,
    });

    expect(actual).to.deep.equal(state);
  });
});
