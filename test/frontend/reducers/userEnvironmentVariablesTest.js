import { expect } from 'chai';
import {
  userEnvironmentVariablesFetchStarted,
  userEnvironmentVariablesReceived,
  userEnvironmentVariableAdded,
  userEnvironmentVariableDeleted,
} from '../../../frontend/actions/actionCreators/userEnvironmentVariableActions';

import {
  httpError,
} from '../../../frontend/actions/actionCreators/alertActions';

import reducer from '../../../frontend/reducers/userEnvironmentVariables';

describe('userEnvironmentVariablesReducer', () => {
  describe('default', () => {
    it('returns the initial state', () => {
      const result = reducer(undefined, {});

      expect(result).to.deep.eq({});
    });
  });

  describe('unhandled actions', () => {
    it('returns the passed in state', () => {
      const state = { foo: 'bar' };

      const result = reducer(state, {});

      expect(result).to.eq(state);
    });
  });

  describe('userEnvironmentVariablesFetchStarted', () => {
    const siteId = 1;
    const action = userEnvironmentVariablesFetchStarted(siteId);

    it('sets isLoading to true for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].isLoading).to.be.true;
    });

    it('clears data for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].data).to.be.empty;
    });
  });

  describe('userEnvironmentVariablesReceived', () => {
    const siteId = 1;
    const uevs = [];
    const action = userEnvironmentVariablesReceived(siteId, uevs);

    it('sets isLoading to false for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].isLoading).to.be.false;
    });

    it('sets data for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].data).to.eq(uevs);
    });
  });

  describe('userEnvironmentVariableAdded', () => {
    const siteId = 1;
    const uev = {};
    const action = userEnvironmentVariableAdded(siteId, uev);

    it('sets isLoading to false for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].isLoading).to.be.false;
    });

    it('adds the uev for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].data).to.include(uev);
    });
  });

  describe('userEnvironmentVariableDeleted', () => {
    const siteId = 1;
    const uevId = 2;
    const action = userEnvironmentVariableDeleted(siteId, uevId);
    const state = {
      [siteId]: {
        data: [
          { id: uevId },
        ],
      },
    };

    it('sets isLoading to false for the site', () => {
      const result = reducer(state, action);

      expect(result[siteId].isLoading).to.be.false;
    });

    it('removes the uev for the site', () => {
      const result = reducer(state, action);

      expect(result[siteId].data).not.to.deep.include({ id: uevId });
    });
  });

  describe('httpErrorType', () => {
    const siteId = 1;
    const action = httpError('', { siteId });

    it('sets isLoading to false for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].isLoading).to.be.false;
    });

    it('clears data for the site', () => {
      const result = reducer({}, action);

      expect(result[siteId].data).to.be.empty;
    });
  });
});
