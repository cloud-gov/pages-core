import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("buildActions", () => {
  let fixture;
  let dispatch;
  let buildsReceivedActionCreator;
  let fetchBuilds;
  
  beforeEach(() => {
    dispatch = spy();
    buildsReceivedActionCreator = stub();
    fetchBuilds = stub();
    
    fixture = proxyquire("../../../../assets/app/actions/buildActions", {
      "./actionCreators/buildActions": {
        buildsReceived: buildsReceivedActionCreator
      },
      "../util/federalistApi": {
        fetchBuilds: fetchBuilds
      },
      "../store": {
        dispatch: dispatch
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
});
