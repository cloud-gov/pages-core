import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("userReducer", () => {
  let fixture;
  const USER_RECEIVED = "hi, user!";

  beforeEach(() => {
    fixture = proxyquire("../../../../assets/app/reducers/user", {
      "../actions/actionCreators/userActions": {
        userReceivedType: USER_RECEIVED
      } 
    }).default;
  });

  it("defaults to false and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not what you're looking for",
      hello: "alijasfjir"
    });

    expect(actual).to.be.false;
  });

  it("records lots of data from the user received action, overwriting what's there", () => {
    const user = {
      id: 12,
      username: "bob",
      email: "no-email@nothingtoseeheresopleasego.org",
      passports: [ "what is this?", "good question."],
      createdAt: "Monday morning.",
      updatedAt: "Thursday, late in the afternoon."
    };

    const actual = fixture({ anything: "goes here" }, {
      type: USER_RECEIVED,
      user: user
    });

    expect(actual).to.deep.equal(user);
  });
});
