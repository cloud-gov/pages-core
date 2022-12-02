import sinon from 'sinon';
import * as reactRouter from 'react-router-dom';
import {
  pushRouterHistory,
  replaceRouterHistory,
} from '../../../../frontend/actions/actionCreators/navigationActions';

describe('navigationActions', () => {
  let rediectStub;

  beforeEach(() => {
    rediectStub = sinon.stub(reactRouter, 'redirect');
  });

  afterEach(() => {
    sinon.restore();
  });

  const path = '/what/is/this/path/of/which/you/speak';

  describe('.pushRouterHistory', () => {
    it('navigates', () => {
      pushRouterHistory(path);
      sinon.assert.calledWithExactly(rediectStub, path);
    });
  });

  describe('.replaceRouterHistory', () => {
    it('navigates and replaces history', () => {
      replaceRouterHistory(path);
      sinon.assert.calledWithExactly(rediectStub, path, { replace: true });
    });
  });
});
