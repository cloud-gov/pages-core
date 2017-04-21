import { expect } from "chai";
import {
  buildLogsFetchStarted, buildLogsFetchStartedType,
  buildLogsReceived, buildLogsReceivedType,
} from "../../../../frontend/actions/actionCreators/buildLogActions";

describe("buildLogActions actionCreators", () => {
  describe("build logs fetch started", () => {
    it("constructs properly", () => {
      const actual = buildLogsFetchStarted()

      expect(actual).to.deep.equal({
        type: buildLogsFetchStartedType,
      })
    })

    it("exports its type", () => {
      expect(buildLogsFetchStartedType).to.equal("BUILD_LOGS_FETCH_STARTED")
    })
  })

  describe("build logs received", () => {
    it("constructs properly", () => {
      const logs = ["Log 1", "Log2 "];

      const actual = buildLogsReceived(logs);

      expect(actual).to.deep.equal({
        type: buildLogsReceivedType,
        logs: logs,
      });
    });

    it("exports its type", () => {
      expect(buildLogsReceivedType).to.equal("BUILD_LOGS_RECEIVED");
    });
  });
});
