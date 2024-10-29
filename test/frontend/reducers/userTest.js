import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('userReducer', () => {
  let fixture;
  const USER_RECEIVED = 'hi, user!';
  const USER_FETCH_STARTED = 'fetch started';
  const USER_SETTINGS_UPDATED = 'settings updated';

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/user', {
      '../actions/actionCreators/userActions': {
        userReceivedType: USER_RECEIVED,
        userFetchStartedType: USER_FETCH_STARTED,
        userSettingsUpdatedType: USER_SETTINGS_UPDATED,
      },
    }).default;
  });

  it('has a default and ignores other actions', () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: 'alijasfjir',
    });

    expect(actual).to.deep.equal({
      isLoading: false,
      data: {},
    });
  });

  it('sets isLoading to true when USER_FETCH_STARTED', () => {
    const actual = fixture(
      {
        isLoading: false,
        data: {},
      },
      {
        type: USER_FETCH_STARTED,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: true,
      data: {},
    });
  });

  it('returns false when USER_RECEIVED with no user', () => {
    const actual = fixture(undefined, {
      type: USER_RECEIVED,
    });

    expect(actual).to.be.false;
  });

  it('records lots of data and sets isLoading when USER_RECEIVED', () => {
    const user = {
      id: 12,
      username: 'bob',
      email: 'no-email@nothingtoseeheresopleasego.org',
      createdAt: 'Monday morning.',
      updatedAt: 'Thursday, late in the afternoon.',
    };

    const actual = fixture(
      {
        anything: 'goes here',
      },
      {
        type: USER_RECEIVED,
        user,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: false,
      data: user,
    });
  });

  it('records lots of data and sets isLoading when USER_SETTINGS_UPDATED', () => {
    const user = {
      id: 12,
      username: 'bob',
      email: 'no-email@nothingtoseeheresopleasego.org',
      createdAt: 'Monday morning.',
      updatedAt: 'Thursday, late in the afternoon.',
    };

    const actual = fixture(
      {
        anything: 'goes here',
      },
      {
        type: USER_SETTINGS_UPDATED,
        user,
      },
    );

    expect(actual).to.deep.equal({
      isLoading: false,
      data: user,
    });
  });
});
