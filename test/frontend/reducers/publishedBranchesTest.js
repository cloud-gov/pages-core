import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("publishedBranchesReducer", () => {
  let fixture
  const PUBLISHED_BRANCHES_RECEIVED = "published branches received"

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/publishedBranches", {
      "../actions/actionCreators/publishedBranchActions": {
        publishedBranchesReceivedType: PUBLISHED_BRANCHES_RECEIVED,
      }
    }).default
  })

  it("ignores other actions and returns an empty array", () => {
    const BRANCHES = ["Branch 1", "Branch 2"]

    const actual = fixture(undefined, {
      branches: BRANCHES,
      type: "the wrong type",
    })

    expect(actual).to.deep.equal([])
  })

  it("records the branches received in the action", () => {
    const BRANCHES = ["Branch 1", "Branch 2"]

    const actual = fixture([], {
      type: PUBLISHED_BRANCHES_RECEIVED,
      branches: BRANCHES,
    })

    expect(actual).to.deep.equal(BRANCHES)
  })

  it("overrides the branches received in the action", () => {
    const BRANCHES = ["Branch 1", "Branch 2"]

    const actual = fixture(["Branch 3"], {
      type: PUBLISHED_BRANCHES_RECEIVED,
      branches: BRANCHES,
    })

    expect(actual).to.deep.equal(BRANCHES)
  })
})
