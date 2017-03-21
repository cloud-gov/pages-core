import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("publishedBranchesReducer", () => {
  let fixture
  const PUBLISHED_BRANCH_RECEIVED = "published branch received"
  const PUBLISHED_BRANCHES_RECEIVED = "published branches received"

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/publishedBranches", {
      "../actions/actionCreators/publishedBranchActions": {
        publishedBranchReceivedType: PUBLISHED_BRANCH_RECEIVED,
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

  it("adds files received from a branch in the action", () => {
    const BRANCH = { name: "branch", site: { id: 1 }, files: "I am the files!" }
    const state = [
      { name: "master", site: { id: 1 } },
      { name: "branch", site: { id: 1 } },
      { name: "branch", site: { id: 2 } },
    ]

    const actual = fixture(state, {
      type: PUBLISHED_BRANCH_RECEIVED,
      branch: BRANCH,
    })

    expect(actual).to.deep.equal([
      { name: "master", site: { id: 1 } },
      { name: "branch", site: { id: 1 }, files: "I am the files!" },
      { name: "branch", site: { id: 2 } },
    ])
  })
})
