import { expect } from "chai";
import { stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("createDraftBranchName", () => {
  let fixture;
  let encodeB64;

  beforeEach(() => {
    encodeB64 = stub();
    fixture = proxyquire("../../../../assets/app/actions/createDraftBranchName", {
      "../util/encoding": {
        encodeB64: encodeB64
      }
    }).default;
  });

  it("makes the expected draft branch name based on a path", () => {
    const path = "take/away/our/troubles/here";
    const encodedPath = "base64 encoded path";
    encodeB64.withArgs(path).returns(encodedPath);

    const actual = fixture(path);

    expect(actual).to.equal(`_draft-${encodedPath}`);
  });
});
