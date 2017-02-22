import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("maps reducers", () => {
  let fixture;
  const BUILDS = "builds are here";
  const ALERT = "alerts is here";
  const SITES = "sites are here";
  const USER = "user is here";

  beforeEach(() => {
    fixture = proxyquire("../../../assets/app/reducers.js", {
      "./reducers/builds": BUILDS,
      "./reducers/alert": ALERT,
      "./reducers/sites": SITES,
      "./reducers/user": USER
    }).default;
  });

  it("maps builds reducer", () => {
    expect(fixture.builds).to.equal(BUILDS);
  });

  it("maps alert reducer", () => {
    expect(fixture.alert).to.equal(ALERT);
  });

  it("maps sites reducer", () => {
    expect(fixture.sites).to.equal(SITES);
  });

  it("maps user reducer", () => {
    expect(fixture.user).to.equal(USER);
  });

});
