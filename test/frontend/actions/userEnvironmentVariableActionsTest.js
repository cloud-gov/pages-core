import sinon from 'sinon';
import federalistApi from '../../../frontend/util/federalistApi';
import {
  httpError,
} from '../../../frontend/actions/actionCreators/alertActions';

import {
  userEnvironmentVariableAdded,
  userEnvironmentVariableDeleted,
  userEnvironmentVariablesFetchStarted,
  userEnvironmentVariablesReceived,
} from '../../../frontend/actions/actionCreators/userEnvironmentVariableActions';

import {
  addUserEnvironmentVariable,
  deleteUserEnvironmentVariable,
  fetchUserEnvironmentVariables,
} from '../../../frontend/actions/userEnvironmentVariableActions';

let stubs = {};

describe('useEnvironmentVariableActions', () => {
  beforeEach(() => {
    stubs.scrollTo = sinon.stub();
    global.window = { scrollTo: stubs.scrollTo };
  });

  afterEach(() => {
    sinon.restore();
    global.window = undefined;
    stubs = {};
  });

  describe('.fetchUserEnvironmentVariables', () => {
    const siteId = 1;
    const uevs = [];
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'fetchUserEnvironmentVariables');
      stubs.dispatch = sinon.stub();
    });

    describe('on success', () => {
      beforeEach(() => {
        stubs.fedApi.resolves(uevs);
      });

      it('1) dispatches `userEnvironmentVariablesFetchStarted` action with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            userEnvironmentVariablesFetchStarted(siteId));
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) successfully fetches the uevs using the federalist api with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId);
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) dispatches `userEnvironmentVariablesReceived` with the site id and received uevs', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.secondCall,
            userEnvironmentVariablesReceived(siteId, uevs));
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        stubs.fedApi.rejects(error);
      });

      it('1) dispatches `userEnvironmentVariablesFetchStarted` action with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            userEnvironmentVariablesFetchStarted(siteId));
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) unsuccessfully fetches the uevs using the federalist api with the site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId);
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.secondCall,
            httpError(error.message, { siteId }));
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('4) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `userEnvironmentVariablesReceived`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch,
            userEnvironmentVariablesReceived(siteId, uevs));
        };

        fetchUserEnvironmentVariables(siteId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });

  describe('.deleteUserEnvironmentVariable', () => {
    const siteId = 1;
    const uevId = 2;
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'deleteUserEnvironmentVariable');
      stubs.dispatch = sinon.stub();
    });

    describe('on success', () => {
      beforeEach(() => {
        stubs.fedApi.resolves({});
      });

      it('1) successfully deletes the uev using the federalist api with the site id and uev id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId, uevId);
        };

        deleteUserEnvironmentVariable(siteId, uevId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `userEnvironmentVariableDeleted` with the site id and uev id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            userEnvironmentVariableDeleted(siteId, uevId));
        };

        deleteUserEnvironmentVariable(siteId, uevId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        stubs.fedApi.rejects(error);
      });

      it('1) unsuccessfully deletes the uev using the federalist api with the site id and uev id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId, uevId);
        };

        deleteUserEnvironmentVariable(siteId, uevId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall, httpError(error.message, { siteId }));
        };

        deleteUserEnvironmentVariable(siteId, uevId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        deleteUserEnvironmentVariable(siteId, uevId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `userEnvironmentVariableDeleted`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch,
            userEnvironmentVariableDeleted(siteId, uevId));
        };

        deleteUserEnvironmentVariable(siteId, uevId)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });

  describe('.addUserEnvironmentVariable', () => {
    const siteId = 1;
    const uev = {};
    const error = new Error('foo');

    beforeEach(() => {
      stubs.fedApi = sinon.stub(federalistApi, 'createUserEnvironmentVariable');
      stubs.dispatch = sinon.stub();
    });

    describe('on success', () => {
      beforeEach(() => {
        stubs.fedApi.resolves({});
      });

      it('1) successfully deletes the uev using the federalist api with the site id and uev id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId, uev);
        };

        addUserEnvironmentVariable(siteId, uev)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `userEnvironmentVariableDeleted` with the site id and uev id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall,
            userEnvironmentVariableAdded(siteId, uev));
        };

        addUserEnvironmentVariable(siteId, uev)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });

    describe('on failure', () => {
      beforeEach(() => {
        stubs.fedApi.rejects(error);
      });

      it('1) unsuccessfully deletes the uev using the federalist api with the site id and uev id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.fedApi, siteId, uev);
        };

        addUserEnvironmentVariable(siteId, uev)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('2) dispatches `httpError` action with the error message and site id', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.dispatch.firstCall, httpError(error.message, { siteId }));
        };

        addUserEnvironmentVariable(siteId, uev)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('3) scrolls to the top of the screen', (done) => {
        const assertion = () => {
          sinon.assert.calledWith(stubs.scrollTo, 0, 0);
        };

        addUserEnvironmentVariable(siteId, uev)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });

      it('does NOT dispatch `userEnvironmentVariableAdded`', (done) => {
        const assertion = () => {
          sinon.assert.neverCalledWith(stubs.dispatch, userEnvironmentVariableAdded(siteId, uev));
        };

        addUserEnvironmentVariable(siteId, uev)(stubs.dispatch)
          .then(assertion)
          .then(done);
      });
    });
  });
});
