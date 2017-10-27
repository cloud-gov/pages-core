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
  let showAddNewSiteFieldsActionCreator;
  let hideAddNewSiteFieldsActionCreator;

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
    showAddNewSiteFieldsActionCreator = stub();
    hideAddNewSiteFieldsActionCreator = stub();
    pushHistory = stub();

    fixture = proxyquire('../../../frontend/actions/dispatchActions', {
      './actionCreators/siteActions': {
        sitesFetchStarted: sitesFetchStartedActionCreator,
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
        siteUserAdded: userAddedToSiteActionCreator,
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
    });
  });

  it('updateRouterToSitesUri', () => {
    fixture.updateRouterToSitesUri();
    expect(pushHistory.calledWith('/sites')).to.be.true;
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
});
