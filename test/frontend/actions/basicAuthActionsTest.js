import sinon from 'sinon';
import federalistApi from '../../../frontend/util/federalistApi';
import {
  httpError,
} from '../../../frontend/actions/actionCreators/alertActions';

import {
  siteBasicAuthSaved,
  siteBasicAuthRemoved,
  siteBasicAuthFetchStarted,
  siteBasicAuthReceived,
} from '../../../frontend/actions/actionCreators/siteActions';

import {
  removeBasicAuthFromSite,
  addBasicAuthToSite,
} from '../../../frontend/actions/siteActions';

let stubs = {};

describe('siteBasicAuthActions', () => {
  beforeEach(() => {
    stubs.scrollTo = sinon.stub();
    global.window = { scrollTo: stubs.scrollTo };
  });

  afterEach(() => {
    sinon.restore();
    global.window = undefined;
    stubs = {};
  });

  describe('.removeBasicAuthFromSite', () => {
    const siteId = 1;
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'removeSiteBasicAuth');
      stubs.dispatch = sinon.stub();
    });

    describe('on success', () => {
      beforeEach(() => {
        stubs.fedApi.resolves({});
      });

      it('1) successfully deletes the basicAuth credentials using the federalist api with the site id and basicAuth credentials', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId);
        };

        removeBasicAuthFromSite(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `basicAuthRemoved` with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            siteBasicAuthRemoved(siteId));
        };

        removeBasicAuthFromSite(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        stubs.fedApi.rejects(error);
      });

      it('1) unsuccessfully deletes the basicAuth credentials using the federalist api with the site id and basicAuth credentials', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId);
        };

        removeBasicAuthFromSite(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall, httpError(error.message, { siteId }));
        };

        removeBasicAuthFromSite(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        removeBasicAuthFromSite(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `basicAuthRemoved`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch,
            siteBasicAuthRemoved(siteId));
        };

        removeBasicAuthFromSite(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });

  describe('.saveBasicAuth', () => {
    const siteId = 1;
    const credentials = { username: 'username', password: 'password' };
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'saveSiteBasicAuth');
      stubs.dispatch = sinon.stub();
    });

    describe('on success', () => {
      beforeEach(() => {
        stubs.fedApi.resolves(credentials);
      });

      it('1) successfully deletes the basicAuth credentials using the federalist api with the site id and basicAuth credentials', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId, credentials);
        };

        addBasicAuthToSite(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `basicAuthRemoved` with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            siteBasicAuthSaved(siteId, credentials));
        };

        addBasicAuthToSite(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        stubs.fedApi.rejects(error);
      });

      it('1) unsuccessfully deletes the uev using the federalist api with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId, credentials);
        };

        addBasicAuthToSite(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall, httpError(error.message, { siteId }));
        };

        saveBSiteasicAuth(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        addBasicAuthToSite(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `basicAuthSaved`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch, siteBasicAuthSaved(siteId, credentials));
        };

        addBasicAuthToSite(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });
});
