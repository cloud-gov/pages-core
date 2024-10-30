import { expect } from 'chai';
import {
  userReceived,
  userReceivedType,
  userFetchStarted,
  userFetchStartedType,
  userActionFetchStarted,
  userActionFetchStartedType,
  userActionReceived,
  userActionReceivedType,
  userSettingsUpdated,
  userSettingsUpdatedType,
} from '../../../../frontend/actions/actionCreators/userActions';

describe('userActions actionCreators', () => {
  describe('userReceived', () => {
    it('constructs properly', () => {
      const user = {
        bongo: 'drum',
      };

      const actual = userReceived(user);

      expect(actual).to.deep.equal({
        type: userReceivedType,
        user,
      });
    });

    it('exports its type', () => {
      expect(userReceivedType).to.equal('USER_RECEIVED');
    });
  });

  describe('userFetchStarted', () => {
    it('constructs properly', () => {
      const actual = userFetchStarted();

      expect(actual).to.deep.equal({
        type: userFetchStartedType,
      });
    });

    it('exports its type', () => {
      expect(userFetchStartedType).to.equal('USER_FETCH_STARTED');
    });
  });

  describe('userActionFetchStarted', () => {
    it('exports its type', () => {
      expect(userActionFetchStartedType).to.equal('USER_ACTIONS_FETCH_STARTED');
    });

    it('constructs properly', () => {
      const actual = userActionFetchStarted();

      expect(actual).to.deep.equal({
        type: userActionFetchStartedType,
      });
    });
  });

  describe('userActionReceived', () => {
    it('exports its type', () => {
      expect(userActionReceivedType).to.equal('USER_ACTIONS_RECEIVED');
    });

    it('constructs properly', () => {
      const userActions = ['a', 'b'];
      const actual = userActionReceived(userActions);

      expect(actual).to.deep.equal({
        type: userActionReceivedType,
        userActions,
      });
    });
  });

  describe('userSettingsUpdated', () => {
    it('constructs properly', () => {
      const user = {
        bongo: 'drum',
      };

      const actual = userSettingsUpdated(user);

      expect(actual).to.deep.equal({
        type: userSettingsUpdatedType,
        user,
      });
    });

    it('exports its type', () => {
      expect(userSettingsUpdatedType).to.equal('USER_SETTINGS_UPDATED');
    });
  });
});
