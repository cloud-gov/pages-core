import { expect } from "chai"
import { spy, stub } from "sinon"
import proxyquire from "proxyquire"

proxyquire.noCallThru()

describe("githubBranchActions", () => {
  let fixture
  let dispatch
  let githubBranchesFetchStartedActionCreator
  let githubBranchesReceivedActionCreator
  let githubBranchesFetchErrorActionCreator
  let fetchBranches

  beforeEach(() => {
    dispatch = spy()

    githubBranchesFetchStartedActionCreator = stub()
    githubBranchesReceivedActionCreator = stub()
    githubBranchesFetchErrorActionCreator = stub()

    fetchBranches = stub()

    fixture = proxyquire("../../../frontend/actions/githubBranchActions", {
      "./actionCreators/githubBranchActions": {
        githubBranchesFetchStarted: githubBranchesFetchStartedActionCreator,
        githubBranchesReceived: githubBranchesReceivedActionCreator,
        githubBranchesFetchError: githubBranchesFetchErrorActionCreator,
      },
      "../util/githubApi": {
        fetchBranches: fetchBranches,
      },
      "../store": {
        dispatch: dispatch,
      },
    }).default
  })

  it("fetchBranches", done => {
    const site = "I'm a website 🌐"
    const branches =  ["🌳", "🌲", "🌴"]

    const githubBranchesPromise = Promise.resolve(branches)
    fetchBranches.withArgs(site).returns(githubBranchesPromise)

    const startedAction = { action: "🚦🏎" }
    const receivedAction = { action: "🏁" }
    githubBranchesFetchStartedActionCreator.withArgs().returns(startedAction)
    githubBranchesReceivedActionCreator.withArgs(branches).returns(receivedAction)

    const actual = fixture.fetchBranches(site)

    actual.then(() => {
      expect(dispatch.calledTwice).to.be.true
      expect(dispatch.calledWith(startedAction)).to.be.true
      expect(dispatch.calledWith(receivedAction)).to.be.true
      done()
    })
  })

  it("fetchBranches with an error", () => {
    const site = "I'm a website 🌐"
    const error =  new Error("🚨🔥🚨🔥🚨")

    const githubBranchesPromise = Promise.reject(error)
    fetchBranches.withArgs(site).returns(githubBranchesPromise)

    const startedAction = { action: "🚦🏎" }
    const errorAction = { action: "⛔️" }
    githubBranchesFetchStartedActionCreator.withArgs().returns(startedAction)
    githubBranchesFetchErrorActionCreator.withArgs(error).returns(errorAction)

    const actual = fixture.fetchBranches(site)

    return actual.then(() => {
      expect(dispatch.calledTwice).to.be.true
      expect(dispatch.calledWith(startedAction)).to.be.true
      expect(dispatch.calledWith(errorAction)).to.be.true
    })
  })
})
