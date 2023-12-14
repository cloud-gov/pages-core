import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildActions", () => {
  let fixture;
  let dispatch;
  let buildsFetchStartedActionCreator;
  let buildsReceivedActionCreator;
  let buildFetchStartedActionCreator;
  let buildReceivedActionCreator;
  let buildRestartedActionCreator;
  let fetchBuild;
  let fetchBuilds;
  let restartBuild;
  let alertSuccess;

  beforeEach(() => {
    dispatch = spy();
    buildsFetchStartedActionCreator = stub()
    buildsReceivedActionCreator = stub()
    buildFetchStartedActionCreator = stub()
    buildReceivedActionCreator = stub()
    buildRestartedActionCreator = stub();

    fetchBuild = stub()
    fetchBuilds = stub()
    restartBuild = stub();

    alertSuccess = stub();

    fixture = proxyquire("../../../frontend/actions/buildActions", {
      "./actionCreators/buildActions": {
        buildsFetchStarted: buildsFetchStartedActionCreator,
        buildsReceived: buildsReceivedActionCreator,
        buildFetchStarted: buildFetchStartedActionCreator,
        buildReceived: buildReceivedActionCreator,
        buildRestarted: buildRestartedActionCreator,
      },
      "../util/federalistApi": {
        fetchBuilds: fetchBuilds,
        fetchBuild: fetchBuild,
        restartBuild: restartBuild,
      },
      "../store": {
        dispatch: dispatch,
      },
      './alertActions': {
        alertSuccess,
      },
    }).default;
  });

  it("fetchBuilds", done => {
    const site = { id: "🎫" }
    const builds = ["🔧", "🔨", "⛏"]
    const buildsPromise = Promise.resolve(builds)
    const startedAction = { action: "🚦" }
    const receivedAction = { action: "🏁" }

    fetchBuilds.withArgs(site).returns(buildsPromise)
    buildsFetchStartedActionCreator.withArgs().returns(startedAction)
    buildsReceivedActionCreator.withArgs(builds).returns(receivedAction)

    const actual = fixture.fetchBuilds(site)

    actual.then(() => {
      expect(dispatch.calledTwice).to.be.true
      expect(dispatch.calledWith(startedAction)).to.be.true
      expect(dispatch.calledWith(receivedAction)).to.be.true
      done()
    })
  })

  it("fetchBuild", done => {
    const id = "🎫"
    const build = {
      "we": "like to build it's true",
      "how": "about you?"
    };
    const buildPromise = Promise.resolve(build)
    const startedAction = { action: "🚦" }
    const receivedAction = { action: "🏁" }

    fetchBuild.withArgs(id).returns(buildPromise)
    buildFetchStartedActionCreator.withArgs().returns(startedAction)
    buildReceivedActionCreator.withArgs(build).returns(receivedAction)

    const actual = fixture.fetchBuild(id)

    actual.then(() => {
      expect(dispatch.calledTwice).to.be.true
      expect(dispatch.calledWith(startedAction)).to.be.true
      expect(dispatch.calledWith(receivedAction)).to.be.true
      done()
    })
  })

  describe("restartBuild", () => {
    it("build is restarted", done => {
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
        done()
      });
    });

    it("build is NOT restarted", done => {
      const build = {};
      const buildPromise = Promise.resolve(build);
      restartBuild.withArgs().returns(buildPromise);
      expect(alertSuccess.called).to.be.false;
      const actual = fixture.restartBuild();
      actual.then(() => {
        expect(dispatch.notCalled).to.be.true;
        expect(alertSuccess.calledWith('Build is already queued.')).to.be.true;
        done()
      });
    });
  });
});
