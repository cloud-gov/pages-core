import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildActions", () => {
  let fixture;
  let dispatch;
  let buildsReceivedActionCreator;
  let buildRestartedActionCreator;
  let fetchBuilds;
  let restartBuild;

  beforeEach(() => {
    dispatch = spy();
    buildsReceivedActionCreator = stub();
    buildRestartedActionCreator = stub();

    fetchBuilds = stub();
    restartBuild = stub();

    fixture = proxyquire("../../../../assets/app/actions/buildActions", {
      "./actionCreators/buildActions": {
        buildsReceived: buildsReceivedActionCreator,
        buildRestarted: buildRestartedActionCreator,
      },
      "../util/federalistApi": {
        fetchBuilds: fetchBuilds,
        restartBuild: restartBuild,
      },
      "../store": {
        dispatch: dispatch,
      }
    }).default;
  });

  it("fetchBuilds", () => {
    const builds = {
      "we": "like to build it's true",
      "how": "about you?"
    };
    const buildsPromise = Promise.resolve(builds);
    const action = {
      action: "action"
    };
    fetchBuilds.withArgs().returns(buildsPromise);
    buildsReceivedActionCreator.withArgs(builds).returns(action);

    const actual = fixture.fetchBuilds();

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(action)).to.be.true;
    });
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
