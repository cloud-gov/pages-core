import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("dispatchActions", () => {
  let fixture;
  let dispatch;
  let sitesReceivedActionCreator, siteAddedActionCreator, siteDeletedActionCreator,
      siteUpdatedActionCreator, siteBranchesReceivedActionCreator,
      updateRouterActionCreator, siteLoadingActionCreator,
      siteInvalidActionCreator, pushHistory;

  const action = { whatever: "bub" };
  const site = { site: "site1" };
  const siteId = "42";

  beforeEach(() => {
    dispatch = spy();
    sitesReceivedActionCreator = stub();
    updateRouterActionCreator = stub();
    siteAddedActionCreator = stub();
    siteUpdatedActionCreator = stub();
    siteDeletedActionCreator = stub();
    siteBranchesReceivedActionCreator = stub();
    siteLoadingActionCreator = stub();
    siteInvalidActionCreator = stub();
    pushHistory = stub();

    fixture = proxyquire("../../../frontend/actions/dispatchActions", {
      "./actionCreators/siteActions": {
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
        siteBranchesReceived: siteBranchesReceivedActionCreator,
        siteInvalid: siteInvalidActionCreator,
        siteLoading: siteLoadingActionCreator
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

  it("updateRouterToSpecificSiteUri", () => {
    const siteId = "7";
    fixture.updateRouterToSpecificSiteUri(siteId);
    expect(pushHistory.calledWith(`/sites/${siteId}`)).to.be.true;
  });

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

  it("dispatchSiteBranchesReceivedAction", () => {
    const branches = "stuff and things, you know";
    siteBranchesReceivedActionCreator.withArgs(siteId, branches).returns(action);

    fixture.dispatchSiteBranchesReceivedAction(siteId, branches);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchSiteInvalidAction', () => {
    siteInvalidActionCreator.withArgs(site, false).returns(action);
    fixture.dispatchSiteInvalidAction(site, false);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it('dispatchSiteLoadingAction', () => {
    siteLoadingActionCreator.withArgs(site, false).returns(action);
    fixture.dispatchSiteLoadingAction(site, false);

    expect(dispatch.calledWith(action)).to.be.true;
  });
});
