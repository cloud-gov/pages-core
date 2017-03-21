import { expect } from "chai"
import { spy, stub } from "sinon"
import proxyquire from "proxyquire"

proxyquire.noCallThru()

describe("publishedBranchActions", () => {
  let fixture
  let dispatch
  let publishedBranchReceivedActionCreator
  let publishedBranchesReceivedActionCreator
  let fetchPublishedBranch
  let fetchPublishedBranches

  beforeEach(() => {
    dispatch = spy()
    publishedBranchReceivedActionCreator = stub()
    publishedBranchesReceivedActionCreator = stub()

    fetchPublishedBranch = stub()
    fetchPublishedBranches = stub()

    fixture = proxyquire("../../../frontend/actions/publishedBranchActions", {
      "./actionCreators/publishedBranchActions": {
        publishedBranchReceived: publishedBranchReceivedActionCreator,
        publishedBranchesReceived: publishedBranchesReceivedActionCreator,
      },
      "../util/federalistApi": {
        fetchPublishedBranch: fetchPublishedBranch,
        fetchPublishedBranches: fetchPublishedBranches,
      },
      "../store": {
        dispatch: dispatch,
      },
    }).default
  })

  it("fetchPublishedBranch", done => {
    const branch = "I'm a branch"
    const publishedBranchPromise = Promise.resolve(branch)
    const action = { action: "action" }
    fetchPublishedBranch.withArgs().returns(publishedBranchPromise)
    publishedBranchReceivedActionCreator.withArgs(branch).returns(action)

    const actual = fixture.fetchPublishedBranch()

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true,
      expect(dispatch.calledWith(action)).to.be.true
      done()
    })
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
