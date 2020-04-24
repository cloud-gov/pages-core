import { expect } from 'chai';
import {
  userEnvironmentVariablesFetchStarted, userEnvironmentVariablesFetchStartedType,
  userEnvironmentVariablesReceived, userEnvironmentVariablesReceivedType,
  userEnvironmentVariableAdded, userEnvironmentVariableAddedType,
  userEnvironmentVariableDeleted, userEnvironmentVariableDeletedType,
} from '../../../../frontend/actions/actionCreators/userEnvironmentVariableActions';

describe('userEnvironmentVariableActions actionCreators', () => {
  describe('userEnvironmentVariablesFetchStarted', () => {
    it('constructs properly', () => {
      const siteId = 1;

      const actual = userEnvironmentVariablesFetchStarted(siteId);

      expect(actual).to.deep.equal({
        type: userEnvironmentVariablesFetchStartedType,
        payload: { siteId },
      });
    });
  });

  describe('userEnvironmentVariablesReceived', () => {
    it('constructs properly', () => {
      const siteId = 1;
      const userEnvironmentVariables = [{}];

      const actual = userEnvironmentVariablesReceived(siteId, userEnvironmentVariables);

      expect(actual).to.deep.equal({
        type: userEnvironmentVariablesReceivedType,
        payload: { siteId, userEnvironmentVariables },
      });
    });
  });

  describe('userEnvironmentVariableAdded', () => {
    it('constructs properly', () => {
      const siteId = 1;
      const userEnvironmentVariable = {};

      const actual = userEnvironmentVariableAdded(siteId, userEnvironmentVariable);

      expect(actual).to.deep.equal({
        type: userEnvironmentVariableAddedType,
        payload: { siteId, userEnvironmentVariable },
      });
    });
  });

  describe('userEnvironmentVariableDeleted', () => {
    it('constructs properly', () => {
      const siteId = 1;
      const userEnvironmentVariableId = 2;

      const actual = userEnvironmentVariableDeleted(siteId, userEnvironmentVariableId);

      expect(actual).to.deep.equal({
        type: userEnvironmentVariableDeletedType,
        payload: { siteId, userEnvironmentVariableId },
      });
    });
  });
});
