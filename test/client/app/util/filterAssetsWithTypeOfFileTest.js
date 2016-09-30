import { expect } from "chai";
import fixture from "../../../../assets/app/util/filterAssetsWithTypeOfFile";

describe("filterAssetsWithTypeOfFile", () => {
  it("returns only the objects whose type property matches 'file'", () => {
    const asset1 = { };
    const asset2 = {
      hi: "you"
    };
    const asset3 = {
      boo: "cow",
      type: "file"
    };
    const asset4 = {
      something: "here",
      type: "nope"
    };
    const asset5 = {
      type: "file",
      bug: "moth"
    };
    const assets = [ asset1, asset2, asset3, asset4, asset5 ];

    const actual = fixture(assets);

    expect(actual).to.deep.equal([ asset3, asset5 ]);
  });
});
