import { expect } from "chai"
import { spy, stub } from "sinon"
import proxyquire from "proxyquire"

proxyquire.noCallThru()

describe("publishedBranchActions", () => {
  let fixture
  let dispatch
  let publishedBranchesReceivedActionCreator
  let fetchPublishedBranches

  beforeEach(() => {
    dispatch = spy()
    publishedBranchesReceivedActionCreator = stub()

    fetchPublishedBranches = stub()

    fixture = proxyquire("../../../frontend/actions/publishedBranchActions", {
      "./actionCreators/publishedBranchActions": {
        publishedBranchesReceived: publishedBranchesReceivedActionCreator,
      },
      "../util/federalistApi": {
        fetchPublishedBranches: fetchPublishedBranches,
      },
      "../store": {
        dispatch: dispatch,
      },
    }).default
  })

  it("fetchPublishedBranches", done => {
    const branches = ["Branch 1", "Branch 2"]
    const publishedBranchesPromise = Promise.resolve(branches)
    const action = { action: "action" }
    fetchPublishedBranches.withArgs().returns(publishedBranchesPromise)
    publishedBranchesReceivedActionCreator.withArgs(branches).returns(action)

    const actual = fixture.fetchPublishedBranches()

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true
      expect(dispatch.calledWith(action)).to.be.true
      done()
    })
  })
})
