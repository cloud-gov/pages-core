import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildActions", () => {
  let fixture;
  let dispatch;
  let buildLogsReceivedActionCreator;
  let fetchBuildLogs;

  beforeEach(() => {
    dispatch = spy();
    buildLogsReceivedActionCreator = stub();

    fetchBuildLogs = stub();

    fixture = proxyquire("../../../../assets/app/actions/buildLogActions", {
      "./actionCreators/buildActions": {
        buildLogsReceived: buildLogsReceivedActionCreator,
      },
      "../util/federalistApi": {
        fetchBuildLogs: fetchBuildLogs,
      },
      "../store": {
        dispatch: dispatch,
      }
    }).default;
  });

  it("fetchBuildLogs", () => {
    const logs = ["Log 1", "Log 2"];
    const buildLogsPromise = Promise.resolve(logs);
    const action = {
      action: "action"
    };
    fetchBuildLogs.withArgs().returns(buildLogsPromise);
    buildLogsReceivedActionCreator.withArgs(logs).returns(action);

    const actual = fixture.fetchBuildLogs();

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(action)).to.be.true;
    });
  });
});
