import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildLogsReducer", () => {
  let fixture;
  const BUILD_LOGS_RECEIVED = "build logs received!";

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/buildLogs.js", {
      "../actions/actionCreators/buildLogActions": {
        buildLogsReceivedType: BUILD_LOGS_RECEIVED,
      }
    }).default;
  });

  it("ignores other actions and returns and empty array", () => {
    const LOGS = ["Log 1", "Log 2"]

    const actual = fixture(undefined, {
      type: "Not the right action type",
      logs: LOGS
    });

    expect(actual).to.deep.equal([]);
  });

  it("records the build logs received in the action", () => {
    const LOGS = ["Log 1", "Log 2"]

    const actual = fixture([], {
      type: BUILD_LOGS_RECEIVED,
      logs: LOGS
    });

    expect(actual).to.deep.equal(LOGS);
  });

  it("overrides the build logs with the ones received in the action", () => {
    const LOGS = ["Log 1", "Log 2"]

    const actual = fixture(["Log 3"], {
      type: BUILD_LOGS_RECEIVED,
      logs: LOGS
    });

    expect(actual).to.deep.equal(LOGS);
  });
});
