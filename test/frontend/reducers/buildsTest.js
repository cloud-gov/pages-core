import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();


describe("buildsReducer", () => {
  let fixture;
  const BUILDS_RECEIVED = "builds received!";
  const BUILD_RESTARTED = "build restarted!";

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/builds.js", {
      "../actions/actionCreators/buildActions": {
        buildsReceivedType: BUILDS_RECEIVED,
        buildRestartedType: BUILD_RESTARTED,
      }
    }).default;
  });

  it("ignores other actions and defaults to an empty array", () => {
    const BUILDS = [ "build a", "build b" ];

    const actual = fixture(undefined, {
      type: "Ignore me because I am not the one",
      builds: BUILDS
    });

    expect(actual).to.deep.equal([]);
  });

  it("records the builds received in the action", () => {
    const BUILDS = [ "build a", "build b" ];

    const actual = fixture([], {
      type: BUILDS_RECEIVED,
      builds: BUILDS
    });

    expect(actual).to.deep.equal(BUILDS);
  });

  it("overrides with the builds received in the action", () => {
    const BUILDS = [ "build a", "build b" ];

    const actual = fixture(["build z"], {
      type: BUILDS_RECEIVED,
      builds: BUILDS
    });

    expect(actual).to.deep.equal(BUILDS);
  });

  it("adds the restarted build in the action", () => {
    const BUILDS = [ "build b", "build c" ];
    const BUILD = "build a";

    const actual = fixture(BUILDS, {
      type: BUILD_RESTARTED,
      build: BUILD
    });

    expect(actual).to.deep.equal([BUILD, ...BUILDS])
  });
});
