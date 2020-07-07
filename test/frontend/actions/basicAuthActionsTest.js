import sinon from 'sinon';
import federalistApi from '../../../frontend/util/federalistApi';
import {
  httpError,
} from '../../../frontend/actions/actionCreators/alertActions';

import {
  basicAuthSaved,
  basicAuthRemoved,
  basicAuthFetchStarted,
  basicAuthReceived,
} from '../../../frontend/actions/actionCreators/basicAuthActions';

import {
  fetchBasicAuth,
  removeBasicAuth,
  saveBasicAuth,
} from '../../../frontend/actions/basicAuthActions';

let stubs = {};

describe('basicAuthActions', () => {
  beforeEach(() => {
    stubs.scrollTo = sinon.stub();
    global.window = { scrollTo: stubs.scrollTo };
  });

  afterEach(() => {
    sinon.restore();
    global.window = undefined;
    stubs = {};
  });

  describe('.fetchBasicAuth', () => {
    const siteId = 1;
    const credentials = { username: 'username', password: 'password' };
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'fetchBasicAuth');
      stubs.dispatch = sinon.stub();
    });

    describe('on success', () => {
      beforeEach(() => {
        stubs.fedApi.resolves(credentials);
      });

      it('1) dispatches `basicAuthFetchStarted` action with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            basicAuthFetchStarted(siteId));
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) successfully fetches the basicAuth credentials using the federalist api with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId);
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) dispatches `basicAuthReceived` with the site id and received credentials', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.secondCall,
            basicAuthReceived(siteId, credentials));
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        stubs.fedApi.rejects(error);
      });

      it('1) dispatches `basicAuthFetchStarted` action with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            basicAuthFetchStarted(siteId));
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) unsuccessfully fetches the credentialss using the federalist api with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId);
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.secondCall,
            httpError(error.message, { siteId }));
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('4) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `basicAuthReceived`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch,
            basicAuthReceived(siteId, credentials));
        };

        fetchBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });

  describe('.removeBasicAuth', () => {
    const siteId = 1;
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'removeBasicAuth');
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

        removeBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `basicAuthRemoved` with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            basicAuthRemoved(siteId));
        };

        removeBasicAuth(siteId)(stubs.dispatch)
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

        removeBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall, httpError(error.message, { siteId }));
        };

        removeBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        removeBasicAuth(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `basicAuthRemoved`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch,
            basicAuthRemoved(siteId));
        };

        removeBasicAuth(siteId)(stubs.dispatch)
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
      stubs.fedApi = sinon.stub(federalistApi, 'saveBasicAuth');
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

        saveBasicAuth(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `basicAuthRemoved` with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            basicAuthSaved(siteId, credentials));
        };

        saveBasicAuth(siteId, credentials)(stubs.dispatch)
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

        saveBasicAuth(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall, httpError(error.message, { siteId }));
        };

        saveBasicAuth(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        saveBasicAuth(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `basicAuthSaved`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch, basicAuthSaved(siteId, credentials));
        };

        saveBasicAuth(siteId, credentials)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });
});
