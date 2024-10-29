import { expect } from 'chai';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const dispatchHideAddNewSiteFieldsAction = spy();

const actions = proxyquire('../../../frontend/actions/addNewSiteFieldsActions', {
  './dispatchActions': {
    dispatchHideAddNewSiteFieldsAction,
  },
}).default;

describe('addNewSiteFieldsActions', () => {
  it('hideAddNewSiteFields()', () => {
    actions.hideAddNewSiteFields();
    expect(dispatchHideAddNewSiteFieldsAction.calledOnce).to.be.true;
  });
});
