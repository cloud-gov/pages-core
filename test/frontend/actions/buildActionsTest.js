import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildActions", () => {
  let fixture;
  let dispatch;
  let buildRestartedActionCreator;
  let restartBuild;

  beforeEach(() => {
    dispatch = spy();
    buildRestartedActionCreator = stub();

    restartBuild = stub();

    fixture = proxyquire("../../../frontend/actions/buildActions", {
      "./actionCreators/buildActions": {
        buildRestarted: buildRestartedActionCreator,
      },
      "../util/federalistApi": {
        restartBuild: restartBuild,
      },
      "../store": {
        dispatch: dispatch,
      }
    }).default;
  });

  it("restartBuild", () => {
    const build = {
      "we": "like to build it's true",
      "how": "about you?"
    };
    const buildPromise = Promise.resolve(build);
    const action = {
      action: "action"
    };
    restartBuild.withArgs().returns(buildPromise);
    buildRestartedActionCreator.withArgs(build).returns(action);

    const actual = fixture.restartBuild();

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(action)).to.be.true;
    });
  });
});
