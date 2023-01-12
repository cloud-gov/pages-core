import sinon from 'sinon';
// TODO: this also needs fixing
import * as reactRouter from 'react-router-dom';
import {
  pushRouterHistory,
  replaceRouterHistory,
} from '../../../../frontend/actions/actionCreators/navigationActions';

describe('navigationActions', () => {
  let navigateStub;

  beforeEach(() => {
    navigateStub = sinon.stub(reactRouter, 'navigate').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  const path = '/what/is/this/path/of/which/you/speak';

  describe('.pushRouterHistory', () => {
    it('navigates', () => pushRouterHistory(path)
      .then(() => sinon.assert.calledWithExactly(navigateStub, path)));
  });

  describe('.replaceRouterHistory', () => {
    it('navigates and replaces history', () => replaceRouterHistory(path)
      .then(() => sinon.assert.calledWithExactly(navigateStub, path, { replace: true })));
  });
});
