import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('alertReducer', () => {
  let fixture;

  // Action types
  const HTTP_ERROR = 'errant HTTP';
  const HTTP_SUCCESS = 'success';
  const CLEAR = 'clear';
  const SET_STALE = 'set stale';

  // Status
  const ERROR_STATUS = 'error';
  const INFO_STATUS = 'info';

  // States
  const initialState = {
    message: '',
    status: '',
    stale: false,
  };

  const successState = {
    message: 'yey',
    status: 'info',
    stale: false,
  };

  beforeEach(() => {
    fixture = proxyquire('../../../frontend/reducers/alert', {
      '../actions/actionCreators/alertActions': {
        httpErrorType: HTTP_ERROR,
        httpSuccessType: HTTP_SUCCESS,
        clearType: CLEAR,
        setStaleType: SET_STALE,
      },
    }).default;
  });

  it('defaults to an object with `message` and `status` keys and ignores other actions', () => {
    const actual = fixture(undefined, {
      type: 'not the error',
      hello: 'world',
    });

    expect(actual).to.deep.equal({
      message: '',
      status: '',
      stale: false,
    });
  });

  it('keeps track of an error', () => {
    const SOME_ERROR = 'HTTP 418';

    const actual = fixture(initialState, {
      type: HTTP_ERROR,
      message: SOME_ERROR,
      status: ERROR_STATUS,
    });

    expect(actual).to.deep.equal({
      message: SOME_ERROR,
      status: ERROR_STATUS,
      stale: false,
    });
  });

  it('keeps track of a success', () => {
    const SUCCESS = 'You have successfully done a thing';
    const actual = fixture(initialState, {
      type: HTTP_SUCCESS,
      message: SUCCESS,
      status: INFO_STATUS,
    });

    expect(actual).to.deep.equal({
      message: SUCCESS,
      status: INFO_STATUS,
      stale: false,
    });
  });

  it('overrides an existing alert', () => {
    const SOME_ERROR = 'HTTP 418';

    const actual = fixture(successState, {
      type: HTTP_ERROR,
      message: SOME_ERROR,
      status: ERROR_STATUS,
    });

    expect(actual).to.deep.equal({
      message: SOME_ERROR,
      status: ERROR_STATUS,
      stale: false,
    });
  });

  it('manages alert freshness', () => {
    const actual = fixture(successState, {
      type: SET_STALE,
    });

    expect(actual).to.have.deep.property('stale', true);
  });

  it('provides the initial empty state on clear', () => {
    const actual = fixture(successState, {
      type: CLEAR,
    });

    expect(actual).to.deep.equal(initialState);
  });
});
