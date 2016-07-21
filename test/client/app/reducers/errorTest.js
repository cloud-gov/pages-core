import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("errorReducer", () => {
  let fixture;
  const HTTP_ERROR = "errant HTTP";
  
  beforeEach(() => {
    fixture = proxyquire("../../../../assets/app/reducers/error", {
      "../constants": {
        errorActionTypes: {
          HTTP_ERROR: HTTP_ERROR
        }
      }
    }).error;
  });

  it("defaults to an empty string error and ignores other actions", () => {
    const actual = fixture(undefined, {
      type: "not the error",
      hello: "world"
    });

    expect(actual).to.equal("");
  });

  it("keeps track of an error", () => {
    const SOME_ERROR = "HTTP 418";
    
    const actual = fixture("", {
      type: HTTP_ERROR,
      error: SOME_ERROR
    });

    expect(actual).to.equal(SOME_ERROR);
  });

  it("overrides an existing error", () => {
    const SOME_ERROR = "HTTP 418";
    
    const actual = fixture("Very Gruntled!", {
      type: HTTP_ERROR,
      error: SOME_ERROR
    });

    expect(actual).to.equal(SOME_ERROR);
  });
});
