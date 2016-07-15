import { expect } from "chai";
import proxyquire from "proxyquire";
proxyquire.noCallThru();

describe("buildsReducer", () => {
  let fixture;
  const BUILDS_RECEIVED = "builds received!";
  
  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./constants": {
        buildActionTypes: {
          BUILDS_RECEIVED: BUILDS_RECEIVED
        }
      }
    }).builds;
  });

  it("records the builds received in the action", () => {
    const BUILDS = [ "build a", "build b" ];
    
    const actual = fixture([], {
      type: BUILDS_RECEIVED,
      builds: BUILDS
    });

    expect(actual).to.deep.equal(BUILDS);
  });

  it("ignores other action types", () => {
    const BUILDS = [ "build a", "build b" ];
    
    const actual = fixture([], {
      type: "Ignore me because I am not the one",
      builds: BUILDS
    });

    expect(actual).to.deep.equal([]);
  });
});
