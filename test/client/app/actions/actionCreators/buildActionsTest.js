import { expect } from "chai";
import {
  buildsReceived, buildsReceivedType,
  buildRestarted, buildRestartedType,
} from "../../../../../assets/app/actions/actionCreators/buildActions";

describe("buildActions actionCreators", () => {
  describe("builds received", () => {
    it("constructs properly", () => {
      const builds = {
        a: "bee",
        see: "dee"
      };

      const actual = buildsReceived(builds);

      expect(actual).to.deep.equal({
        type: buildsReceivedType,
        builds
      });
    });

    it("exports its type", () => {
      expect(buildsReceivedType).to.equal("BUILDS_RECEIVED");
    });
  });

  describe("build restarted", () => {
    it("constructs properly", () => {
      const build = {
        a: "bee",
        see: "dee"
      };

      const actual = buildRestarted(build);

      expect(actual).to.deep.equal({
        type: buildRestartedType,
        build
      });
    });

    it("exports its type", () => {
      expect(buildRestartedType).to.equal("BUILD_RESTARTED");
    });
  });
});
