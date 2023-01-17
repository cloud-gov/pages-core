import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

describe('dispatchActions', () => {
  let fixture;
  let dispatch;
  let sitesFetchStartedActionCreator;
  let sitesReceivedActionCreator;
  let siteAddedActionCreator;
  let siteDeletedActionCreator;
  let siteUpdatedActionCreator;
  let pushHistory;
  let userAddedToSiteActionCreator;
  let userRemovedFromSiteActionCreator;
  let showAddNewSiteFieldsActionCreator;
  let hideAddNewSiteFieldsActionCreator;
  let reset;

  const action = { whatever: 'bub' };
  const site = { site: 'site1' };

  beforeEach(() => {
    dispatch = spy();
    sitesFetchStartedActionCreator = stub();
    sitesReceivedActionCreator = stub();
    siteAddedActionCreator = stub();
    siteUpdatedActionCreator = stub();
    siteDeletedActionCreator = stub();
    userAddedToSiteActionCreator = stub();
    userRemovedFromSiteActionCreator = stub();
    showAddNewSiteFieldsActionCreator = stub();
    hideAddNewSiteFieldsActionCreator = stub();
    pushHistory = stub();
    reset = stub();

    fixture = proxyquire('../../../frontend/actions/dispatchActions', {
      './actionCreators/siteActions': {
        sitesFetchStarted: sitesFetchStartedActionCreator,
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
        siteUserAdded: userAddedToSiteActionCreator,
        siteUserRemoved: userRemovedFromSiteActionCreator,
      },
      './actionCreators/addNewSiteFieldsActions': {
        showAddNewSiteFields: showAddNewSiteFieldsActionCreator,
        hideAddNewSiteFields: hideAddNewSiteFieldsActionCreator,
      },
      './routeActions': {
        pushHistory,
      },
      '../store': {
        dispatch,
      },
      'redux-form': {
        reset,
      },
    });
  });

  it('dispatchSitesFetchStartedAction', () => {
    sitesFetchStartedActionCreator.returns(action);

    fixture.dispatchSitesFetchStartedAction();

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchSitesReceivedAction', () => {
    const sites = [site];
    sitesReceivedActionCreator.withArgs(sites).returns(action);

    fixture.dispatchSitesReceivedAction(sites);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchSiteAddedAction', () => {
    siteAddedActionCreator.withArgs(site).returns(action);

    fixture.dispatchSiteAddedAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchSiteUpdatedAction', () => {
    siteUpdatedActionCreator.withArgs(site).returns(action);

    fixture.dispatchSiteUpdatedAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchSiteDeletedAction', () => {
    siteDeletedActionCreator.withArgs(site).returns(action);

    fixture.dispatchSiteDeletedAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchUserAddedToSiteAction', () => {
    userAddedToSiteActionCreator.withArgs(site).returns(action);

    fixture.dispatchUserAddedToSiteAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchUserRemovedFromSiteAction', () => {
    userRemovedFromSiteActionCreator.withArgs(site).returns(action);

    fixture.dispatchUserRemovedFromSiteAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchShowAddNewSiteFieldsAction', () => {
    showAddNewSiteFieldsActionCreator.withArgs(site).returns(action);

    fixture.dispatchShowAddNewSiteFieldsAction(site);

    expect(dispatch.calledOnce).to.be.true;
  });

  it('dispatchHideAddNewSiteFieldsAction', () => {
    hideAddNewSiteFieldsActionCreator.withArgs(site).returns(action);

    fixture.dispatchHideAddNewSiteFieldsAction();

    expect(dispatch.calledOnce).to.be.true;
  });

  it('dispatchResetFormAction', () => {
    reset.withArgs('aForm');

    fixture.dispatchResetFormAction();

    expect(dispatch.calledOnce).to.be.true;
  });
});
