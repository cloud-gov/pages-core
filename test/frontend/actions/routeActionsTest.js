import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("routeActions", () => {
  let fixture;
  let dispatch;
  let pushRouterActionCreator;
  let replaceRouterActionCreator;

  beforeEach(() => {
    dispatch = spy();
    pushRouterActionCreator = stub();
    replaceRouterActionCreator = stub();
    fixture = proxyquire("../../../frontend/actions/routeActions", {
      "./actionCreators/navigationActions": {
        pushRouterHistory: pushRouterActionCreator,
        replaceRouterHistory: replaceRouterActionCreator
      },
      "../store": {
        dispatch: dispatch
      }
    });
  });

  describe("pushHistory, replaceHistory", () => {
    it("sends an update router action to the store", () => {
      const path = "/somewhere/out/there";
      const routerAction = {
        foo: "quux"
      };

      pushRouterActionCreator.withArgs(path).returns(routerAction);
      replaceRouterActionCreator.withArgs(path).returns(routerAction);

      fixture.pushHistory(path);
      fixture.replaceHistory(path);

      expect(dispatch.calledTwice).to.be.true;
      expect(dispatch.calledWith(routerAction)).to.be.true;
    });
  });
});
