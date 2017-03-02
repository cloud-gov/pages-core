import { expect } from "chai";
import {
  updateRouterType,
  pushRouterHistory,
  replaceRouterHistory
} from "../../../../frontend/actions/actionCreators/navigationActions";

describe("updateRouter actionCreator", () => {
  const path = "/what/is/this/path/of/which/you/speak";

  it("constructs a browser history push properly", () => {
    const actual = pushRouterHistory(path);

    expect(actual).to.deep.equal({
      type: updateRouterType,
      method: "push",
      arguments: [ path ]
    });
  });

  it("constructs a browser history replace properly", () => {
    const actual = replaceRouterHistory(path);

    expect(actual).to.deep.equal({
      type: updateRouterType,
      method: "replace",
      arguments: [ path ]
    });
  });

  it("exports its type", () => {
    expect(updateRouterType).to.equal("UPDATE_ROUTER");
  });
});
