import { expect } from 'chai';
import {
  userReceived, userReceivedType,
  userFetchStarted, userFetchStartedType,
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
});
