import { expect } from "chai";
import {
  buildsFetchStarted, buildsFetchStartedType,
  buildsReceived, buildsReceivedType,
  buildRestarted, buildRestartedType,
} from "../../../../frontend/actions/actionCreators/buildActions";

describe("buildActions actionCreators", () => {
  describe("builds fetch started", () => {
    it("constructs properly", () => {
      const actual = buildsFetchStarted()
      expect(actual).to.deep.equal({
        type: buildsFetchStartedType
      })
    })

    it("exports its type", () => {
      expect(buildsFetchStartedType).to.equal("BUILDS_FETCH_STARTED")
    })
  })

  describe("builds received", () => {
    it("constructs properly", () => {
      const builds = ["🔧", "🔨", "⛏"]
      const actual = buildsReceived(builds)

      expect(actual).to.deep.equal({
        type: buildsReceivedType,
        builds,
      })
    })

    it("exports its type", () => {
      expect(buildsReceivedType).to.deep.equal("BUILDS_RECEIVED")
    })
  })

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
