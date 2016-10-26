import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("dispatchActions", () => {
  let fixture;
  let dispatch;
  let sitesReceivedActionCreator, siteAddedActionCreator, siteDeletedActionCreator,
      siteUpdatedActionCreator, siteFileContentReceivedActionCreator, siteAssetsReceivedActionCreator,
      siteFilesReceivedActionCreator, siteConfigsReceivedActionCreator, siteBranchesReceivedActionCreator,
      updateRouterActionCreator, pushHistory;

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
    siteFileContentReceivedActionCreator = stub();
    siteAssetsReceivedActionCreator = stub();
    siteFilesReceivedActionCreator = stub();
    siteConfigsReceivedActionCreator = stub();
    siteBranchesReceivedActionCreator = stub();
    pushHistory = stub();

    fixture = proxyquire("../../../../assets/app/actions/dispatchActions", {
      "./actionCreators/siteActions": {
        sitesReceived: sitesReceivedActionCreator,
        siteAdded: siteAddedActionCreator,
        siteUpdated: siteUpdatedActionCreator,
        siteDeleted: siteDeletedActionCreator,
        siteFileContentReceived: siteFileContentReceivedActionCreator,
        siteAssetsReceived: siteAssetsReceivedActionCreator,
        siteFilesReceived: siteFilesReceivedActionCreator,
        siteConfigsReceived: siteConfigsReceivedActionCreator,
        siteBranchesReceived: siteBranchesReceivedActionCreator
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
    pushHistory.withArgs("/sites").returns(action);

    fixture.updateRouterToSitesUri();

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("updateRouterToSpecificSiteUri", () => {
    const siteId = "7";
    pushHistory.withArgs(`/sites/${siteId}`).returns(action);

    fixture.updateRouterToSpecificSiteUri(siteId);

    expect(dispatch.calledWith(action)).to.be.true;
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

  it("dispatchSiteFileContentReceivedAction", () => {
    const fileContent = "stuff and things, you know";
    siteFileContentReceivedActionCreator.withArgs(siteId, fileContent).returns(action);

    fixture.dispatchSiteFileContentReceivedAction(siteId, fileContent);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteAssetsReceivedAction", () => {
    const assets = "stuff and things, you know";
    siteAssetsReceivedActionCreator.withArgs(siteId, assets).returns(action);

    fixture.dispatchSiteAssetsReceivedAction(siteId, assets);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteFilesReceivedAction", () => {
    const files = "stuff and things, you know";
    siteFilesReceivedActionCreator.withArgs(siteId, files).returns(action);

    fixture.dispatchSiteFilesReceivedAction(siteId, files);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteConfigsReceivedAction", () => {
    const configs = "stuff and things, you know";
    siteConfigsReceivedActionCreator.withArgs(siteId, configs).returns(action);

    fixture.dispatchSiteConfigsReceivedAction(siteId, configs);

    expect(dispatch.calledWith(action)).to.be.true;
  });

  it("dispatchSiteBranchesReceivedAction", () => {
    const branches = "stuff and things, you know";
    siteBranchesReceivedActionCreator.withArgs(siteId, branches).returns(action);

    fixture.dispatchSiteBranchesReceivedAction(siteId, branches);

    expect(dispatch.calledWith(action)).to.be.true;
  });
});
