import { expect } from 'chai';
import {
  basicAuthFetchStarted,
  basicAuthReceived,
  basicAuthSaved,
  basicAuthRemoved,
} from '../../../frontend/actions/actionCreators/basicAuthActions';

import {
  httpError,
} from '../../../frontend/actions/actionCreators/alertActions';

import reducer from '../../../frontend/reducers/basicAuth';

describe('basicAuthReducer', () => {
  describe('default', () => {
    it('returns the initial state', () => {
      const result = reducer(undefined, {});

      expect(result).to.deep.eq({
        isLoading: false,
        data: {},
      });
    });
  });

  describe('unhandled actions', () => {
    it('returns the passed in state', () => {
      const state = { foo: 'bar' };

      const result = reducer(state, {});

      expect(result).to.eq(state);
    });
  });

  describe('basicAuthFetchStarted', () => {
    const siteId = 1;
    const action = basicAuthFetchStarted(siteId);
    const credentials = { username: 'username', password: 'password' };

    it('sets isLoading to true for the site basicAuth', () => {
      const result = reducer({}, action);

      expect(result.isLoading).to.be.true;
    });

    it('clears data for the site basicAuth', () => {
      const result = reducer({}, action);

      expect(result.data).to.be.empty;
    });
  });

  describe('basicAuthReceived', () => {
    const siteId = 1;
    const credentials = { username: 'username', password: 'password' };
    const action = basicAuthReceived(siteId, credentials);
    const state = {
      isLoading: true,
      data: {},
    };

    it('sets isLoading to false for the site basicAuth', () => {
      const result = reducer(state, action);

      expect(result.isLoading).to.be.false;
    });

    it('sets data for the site basicAuth', () => {
      const result = reducer(state, action);

      expect(result.data).to.deep.eq(credentials);
    });
  });

  describe('basicAuthSaved', () => {
    const siteId = 1;
    const credentials = { username: 'username', password: 'password' };
    const action = basicAuthSaved(siteId, credentials);
    const state = {
      isLoading: true,
      data: {},
    };

    it('sets isLoading to false for the site basicAuth', () => {
      const result = reducer(state, action);

      expect(result.isLoading).to.be.false;
    });

    it('adds the credentials for the site basicAuth', () => {
      const result = reducer(state, action);

      expect(result.data).to.deep.eql(credentials);
    });
  });

  describe('basicAuthRemoved', () => {
    const siteId = 1;
    const credentials = { username: 'username', password: 'password' };
    const action = basicAuthRemoved(siteId);
    const state = {
      isLoading: true,
      data: credentials,
    };

    it('sets isLoading to false for the site', () => {
      const result = reducer(state, action);

      expect(result.isLoading).to.be.false;
    });

    it('removes the basicAuth credentials for the site', () => {
      const result = reducer(state, action);

      expect(result.data).to.be.empty;
    });
  });

  describe('httpErrorType', () => {
    const siteId = 1;
    const action = httpError('', { siteId });

    it('sets isLoading to false for the site basicAuth', () => {
      const result = reducer({}, action);

      expect(result.isLoading).to.be.false;
    });

    it('clears data for the site basicAuth', () => {
      const result = reducer({}, action);

      expect(result.data).to.be.empty;
    });
  });
});
