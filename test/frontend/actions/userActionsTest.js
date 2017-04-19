import { expect } from "chai";
import { spy, stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("userActions", () => {
  let fixture;
  let dispatch;
  let userReceivedActionCreator, userLogoutActionCreator;
  let fetchUser;

  beforeEach(() => {
    dispatch = spy();
    userReceivedActionCreator = stub();
    userLogoutActionCreator = stub();
    fetchUser = stub();

    fixture = proxyquire("../../../frontend/actions/userActions", {
      "./actionCreators/userActions": {
        userReceived: userReceivedActionCreator,
        userLogout: userLogoutActionCreator
      },
      "../util/federalistApi": {
        fetchUser: fetchUser
      },
      "../store": {
        dispatch: dispatch
      }
    }).default;
  });

  describe("fetchUser", () => {
    it("fetches the user and dispatches a user received action when successful", () => {
      const user = {
        uid: "user id",
        name: "no thanks",
        favoritePancake: "buttermilk"
      };
      const userPromise = Promise.resolve(user);
      const action = {
        action: "action"
      };
      fetchUser.withArgs().returns(userPromise);
      userReceivedActionCreator.withArgs(user).returns(action);

      const actual = fixture.fetchUser();

      actual.then(() => {
        expect(dispatch.calledOnce).to.be.true;
        expect(dispatch.calledWith(action)).to.be.true;
      });
    });

    it("does nothing when fetching the user fails", () => {
      const rejectedPromise = Promise.reject("ignored");
      fetchUser.withArgs().returns(rejectedPromise);

      const actual = fixture.fetchUser();

      actual.then(() => {
        expect(dispatch.called).to.be.false;
        expect(userReceivedActionCreator.called).to.be.false;
      });
    });
  });
});
