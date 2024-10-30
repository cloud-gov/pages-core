import { expect } from 'chai';
import {
  authError,
  authErrorType,
  httpError,
  httpErrorType,
  httpSuccess,
  httpSuccessType,
  setStale,
  setStaleType,
  clear,
  clearType,
} from '../../../../frontend/actions/actionCreators/alertActions';

describe('alertActions actionCreators', () => {
  describe('authError', () => {
    it('constructs properly', () => {
      const actual = authError();

      expect(actual).to.deep.equal({
        type: authErrorType,
      });
    });

    it('exports its type', () => {
      expect(authErrorType).to.equal('AUTH_ERROR');
    });
  });

  describe('httpError', () => {
    it('constructs properly', () => {
      const message = 'use the torque, duke!';

      const actual = httpError(message);

      expect(actual).to.deep.equal({
        type: httpErrorType,
        status: 'error',
        message,
        payload: {},
      });
    });

    it('exports its type', () => {
      expect(httpErrorType).to.equal('HTTP_ERROR');
    });
  });

  describe('httpSuccess', () => {
    it('constructs properly', () => {
      const message = 'fuse the port, swoop!';

      const actual = httpSuccess(message);

      expect(actual).to.deep.equal({
        type: httpSuccessType,
        status: 'info',
        message,
      });
    });

    it('exports its type', () => {
      expect(httpSuccessType).to.equal('HTTP_SUCCESS');
    });
  });

  describe('setStale', () => {
    it('constructs properly', () => {
      const actual = setStale();

      expect(actual).to.deep.equal({
        type: setStaleType,
      });
    });

    it('exports its type', () => {
      expect(setStaleType).to.equal('SET_STALE');
    });
  });

  describe('clear', () => {
    it('constructs properly', () => {
      const actual = clear();

      expect(actual).to.deep.equal({
        type: clearType,
      });
    });

    it('exports its type', () => {
      expect(clearType).to.equal('CLEAR');
    });
  });
});
