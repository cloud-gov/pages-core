import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("maps reducers", () => {
  let fixture;
  const BUILDS = "builds are here";
  const BUILD_LOGS = "build logs are here"
  const ALERT = "alerts is here";
  const PUBLISHED_BRANCHES = "published branches are here"
  const SITES = "sites are here";
  const USER = "user is here";

  beforeEach(() => {
    fixture = proxyquire("../../frontend/reducers.js", {
      "./reducers/builds": BUILDS,
      "./reducers/buildLogs": BUILD_LOGS,
      "./reducers/alert": ALERT,
      "./reducers/publishedBranches": PUBLISHED_BRANCHES,
      "./reducers/sites": SITES,
      "./reducers/user": USER,
    }).default;
  });

  it("maps builds reducer", () => {
    expect(fixture.builds).to.equal(BUILDS);
  });

  it("maps buildLogs reducer", () => {
    expect(fixture.buildLogs).to.equal(BUILD_LOGS)
  })

  it("maps alert reducer", () => {
    expect(fixture.alert).to.equal(ALERT);
  });

  it("maps publishedBranches  reducer", () => {
    expect(fixture.publishedBranches).to.equal(PUBLISHED_BRANCHES)
  })

  it("maps sites reducer", () => {
    expect(fixture.sites).to.equal(SITES);
  });

  it("maps user reducer", () => {
    expect(fixture.user).to.equal(USER);
  });

});
