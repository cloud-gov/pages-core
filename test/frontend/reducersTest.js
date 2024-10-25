import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("maps reducers", () => {
  let fixture;
  const ALERT = "alerts is here";
  const PUBLISHED_BRANCHES = "published branches are here"
  const PUBLISHED_FILES = "published files are here"
  const SITES = "sites are here";
  const BUILDS = "builds are here 🛠"
  const USER = "user is here";
  const GITHUB_BRANCHES = "github branches 🌳 are here"

  beforeEach(() => {
    fixture = proxyquire("../../frontend/reducers.js", {
      "./reducers/alert": ALERT,
      "./reducers/publishedBranches": PUBLISHED_BRANCHES,
      "./reducers/publishedFiles": PUBLISHED_FILES,
      "./reducers/sites": SITES,
      "./reducers/builds": BUILDS,
      "./reducers/user": USER,
      "./reducers/githubBranches": GITHUB_BRANCHES,
    }).default;
  });

  it("maps alert reducer", () => {
    expect(fixture.alert).to.equal(ALERT);
  });

  it("maps publishedBranches  reducer", () => {
    expect(fixture.publishedBranches).to.equal(PUBLISHED_BRANCHES)
  })

  it("maps publishedFiles reducer", () => {
    expect(fixture.publishedFiles).to.equal(PUBLISHED_FILES)
  })

  it("maps sites reducer", () => {
    expect(fixture.sites).to.equal(SITES);
  });

  it("maps builds reducer", () => {
    expect(fixture.builds).to.equal(BUILDS)
  });

  it("maps user reducer", () => {
    expect(fixture.user).to.equal(USER);
  });

  it("maps githubBranches reducer", () => {
    expect(fixture.githubBranches).to.equal(GITHUB_BRANCHES)
  })
});
