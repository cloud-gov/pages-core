import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("routeActions", () => {
  let fixture;
  let dispatch;
  let updateRouterActionCreator;
  
  beforeEach(() => {
    dispatch = spy();
    updateRouterActionCreator = stub();
    fixture = proxyquire("../../../../assets/app/actions/routeActions", {
      "./actionCreators/navigationActions": {
        updateRouter: updateRouterActionCreator
      },
      "../store": {
        dispatch: dispatch
      }
    }).default;
  });

  describe("redirect", () => {
    it("sends an update router action to the store", () => {
      const path = "/somewhere/out/there";
      const routerAction = {
        foo: "quux"
      };
      updateRouterActionCreator.withArgs(path).returns(routerAction);

      fixture.redirect(path);

      expect(dispatch.calledOnce).to.be.true;
      expect(dispatch.calledWith(routerAction)).to.be.true;
    });
  });
});
