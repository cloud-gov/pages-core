import { expect } from "chai";
import { updateRouter, updateRouterType } from "../../../../../assets/app/actions/actionCreators/navigationActions";

describe("updateRouter actionCreator", () => {
  it("constructs properly", () => {
    const path = "/what/is/this/path/of/which/you/speak";
    
    const actual = updateRouter(path);

    expect(actual).to.deep.equal({
      type: updateRouterType,
      method: "push",
      arguments: [ path ]
    });
  });

  it("exports its type", () => {
    expect(updateRouterType).to.equal("UPDATE_ROUTER");
  });
});
