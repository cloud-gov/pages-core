import { expect } from "chai";
import {
  buildLogsReceived, buildLogsReceivedType,
} from "../../../../../assets/app/actions/actionCreators/buildLogActions";

describe("buildLogActions actionCreators", () => {
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
