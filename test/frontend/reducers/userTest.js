import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("userReducer", () => {
  let fixture;
  const USER_RECEIVED = "hi, user!";

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/user", {
      "../actions/actionCreators/userActions": {
        userReceivedType: USER_RECEIVED
      }
    }).default;
  });

  it("has a default and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: "alijasfjir"
    });

    expect(actual).to.deep.equal({ isLoading: false });
  });

  it("records lots of data from the user received action and sets isLoading", () => {
    const user = {
      id: 12,
      username: "bob",
      email: "no-email@nothingtoseeheresopleasego.org",
      createdAt: "Monday morning.",
      updatedAt: "Thursday, late in the afternoon."
    };

    const actual = fixture({ anything: "goes here" }, {
      type: USER_RECEIVED,
      user: user
    });

    expect(actual).to.deep.equal({
      isLoading: false,
      data: user,
    });
  });
});
