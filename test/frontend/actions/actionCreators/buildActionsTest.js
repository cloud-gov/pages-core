import { expect } from "chai";
import {
  buildRestarted, buildRestartedType,
} from "../../../../frontend/actions/actionCreators/buildActions";

describe("buildActions actionCreators", () => {
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
