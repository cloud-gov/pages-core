import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("dispatchActions", () => {
  let fixture;
  let dispatch;
  let sitesFetchStartedActionCreator, sitesReceivedActionCreator,
      siteAddedActionCreator, siteDeletedActionCreator,
      siteUpdatedActionCreator, siteBranchesReceivedActionCreator,
      updateRouterActionCreator, pushHistory;

  const action = { whatever: "bub" };
  const site = { site: "site1" };
  const siteId = "42";

  beforeEach(() => {
    dispatch = spy();
    sitesFetchStartedActionCreator = stub();
    sitesReceivedActionCreator = stub();
    updateRouterActionCreator = stub();
    siteAddedActionCreator = stub();
    siteUpdatedActionCreator = stub();
    siteDeletedActionCreator = stub();
    pushHistory = stub();

    fixture = proxyquire("../../../frontend/actions/dispatchActions", {
      "./actionCreators/siteActions": {
        sitesFetchStarted: sitesFetchStartedActionCreator,
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
      },
      "./routeActions": {
        pushHistory: pushHistory
      },
      "../store": {
        dispatch: dispatch
      }
    });
  });

  it("updateRouterToSitesUri", () => {
    fixture.updateRouterToSitesUri();
    expect(pushHistory.calledWith("/sites")).to.be.true;
  });

  it("dispatchSitesFetchStartedAction", () => {
    sitesFetchStartedActionCreator.returns(action)

    fixture.dispatchSitesFetchStartedAction()

    expect(dispatch.calledWith(action)).to.be.true
  })

  it("dispatchSitesReceivedAction", () => {
    const sites = [ site ];
    sitesReceivedActionCreator.withArgs(sites).returns(action);

    fixture.dispatchSitesReceivedAction(sites);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteAddedAction", () => {
    siteAddedActionCreator.withArgs(site).returns(action);

    fixture.dispatchSiteAddedAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteUpdatedAction", () => {
    siteUpdatedActionCreator.withArgs(site).returns(action);

    fixture.dispatchSiteUpdatedAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteDeletedAction", () => {
    siteDeletedActionCreator.withArgs(site).returns(action);

    fixture.dispatchSiteDeletedAction(site);

    expect(dispatch.calledWith(action)).to.be.true;
  });
});
