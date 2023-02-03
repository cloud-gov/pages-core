import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("publishedBranchesReducer", () => {
  let fixture
  const PUBLISHED_BRANCHES_FETCH_STARTED = "🚦🏎"
  const PUBLISHED_BRANCHES_RECEIVED = "published branches received"

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/publishedBranches", {
      "../actions/actionCreators/publishedBranchActions": {
        publishedBranchesFetchStartedType: PUBLISHED_BRANCHES_FETCH_STARTED,
        publishedBranchesReceivedType: PUBLISHED_BRANCHES_RECEIVED,
      }
    }).default
  })

  it("ignores other actions and returns an initial state", () => {
    const BRANCHES = ["Branch 1", "Branch 2"]

    const actual = fixture(undefined, {
      branches: BRANCHES,
      type: "the wrong type",
    })

    expect(actual).to.deep.equal({ isLoading: false, data: [] })
  })

  it("marks the state as loading when a fetch starts", () => {
    const actual = fixture({ isLoading: false }, {
      type: PUBLISHED_BRANCHES_FETCH_STARTED
    })

    expect(actual).to.deep.equal({ isLoading: true })
  })

  it("records the branches received in the action", () => {
    const BRANCHES = ["Branch 1", "Branch 2"]

    const actual = fixture({ isLoading: true }, {
      type: PUBLISHED_BRANCHES_RECEIVED,
      branches: BRANCHES,
    })

    expect(actual).to.deep.equal({ isLoading: false, data: BRANCHES })
  })

  it("drops the current branches when a new fetch starts", () => {
    const BRANCHES = ["Branch 1", "Branch 2"]

    const actual = fixture({ isLoading: false, data: ["Branch 3"] }, {
      type: PUBLISHED_BRANCHES_FETCH_STARTED,
    })

    expect(actual).to.deep.equal({ isLoading: true })
  })
})
