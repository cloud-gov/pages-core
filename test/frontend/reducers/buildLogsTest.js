import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildLogsReducer", () => {
  let fixture;
  const BUILD_LOGS_FETCH_STARTED = "build logs fetch started!"
  const BUILD_LOGS_RECEIVED = "build logs received!";

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/buildLogs.js", {
      "../actions/actionCreators/buildLogActions": {
        buildLogsFetchStartedType: BUILD_LOGS_FETCH_STARTED,
        buildLogsReceivedType: BUILD_LOGS_RECEIVED,
      }
    }).default;
  });

  it("ignores other actions and returns an initial state", () => {
    const LOGS = ["Log 1", "Log 2"]

    const actual = fixture(undefined, {
      type: "Not the right action type",
      logs: LOGS
    });

    expect(actual).to.deep.equal({ isLoading: false });
  });

  it("marks the state loading when a fetch is started", () => {
    const actual = fixture({ isLoading: false }, {
      type: BUILD_LOGS_FETCH_STARTED
    })

    expect(actual).to.deep.equal({ isLoading: true })
  })

  it("records the build logs received in the action", () => {
    const LOGS = ["Log 1", "Log 2"]

    const actual = fixture({ isLoading: true }, {
      type: BUILD_LOGS_RECEIVED,
      logs: LOGS
    });

    expect(actual).to.deep.equal({ isLoading: false, data: LOGS });
  });

  it("sets the builds logs to the ones in the action when the fetch completes", () => {
    const LOGS = ["Log 1", "Log 2"]

    const actual = fixture({ isLoading: true }, {
      type: BUILD_LOGS_RECEIVED,
      logs: LOGS
    });

    expect(actual).to.deep.equal({ isLoading: false, data: LOGS });
  });
});
