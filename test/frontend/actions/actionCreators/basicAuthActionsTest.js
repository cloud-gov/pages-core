import { expect } from 'chai';
import {
  basicAuthFetchStarted, basicAuthFetchStartedType,
  basicAuthReceived, basicAuthReceivedType,
  basicAuthSaved, basicAuthSavedType,
  basicAuthRemoved, basicAuthRemovedType,
} from '../../../../frontend/actions/actionCreators/basicAuthActions';

describe('basicAuthActions actionCreators', () => {
  describe('basicAuthFetchStarted', () => {
    it('constructs properly', () => {
      const siteId = 1;

      const actual = basicAuthFetchStarted(siteId);

      expect(actual).to.deep.equal({
        type: basicAuthFetchStartedType,
        payload: { siteId },
      });
    });
  });

  describe('basicAuthReceived', () => {
    it('constructs properly', () => {
      const siteId = 1;
      const basicAuth = {};

      const actual = basicAuthReceived(siteId, basicAuth);

      expect(actual).to.deep.equal({
        type: basicAuthReceivedType,
        payload: { siteId, basicAuth },
      });
    });
  });

  describe('basicAuthSaved', () => {
    it('constructs properly', () => {
      const siteId = 1;
      const basicAuth = { username: 'username', password: 'password' };

      const actual = basicAuthSaved(siteId, basicAuth);

      expect(actual).to.deep.equal({
        type: basicAuthSavedType,
        payload: { siteId, basicAuth },
      });
    });
  });

  describe('basicAuthRemoved', () => {
    it('constructs properly', () => {
      const siteId = 1;

      const actual = basicAuthRemoved(siteId);

      expect(actual).to.deep.equal({
        type: basicAuthRemovedType,
        payload: { siteId },
      });
    });
  });
});
