import { expect } from "chai"
import {
  publishedBranchReceived, publishedBranchReceivedType,
  publishedBranchesReceived, publishedBranchesReceivedType,
} from "../../../../frontend/actions/actionCreators/publishedBranchActions";

describe("publishedBranchActions actionCreators", () => {
  describe("published branch received", () => {
    it("constructs properly", () => {
      const branch = "I'm a branch"

      const actual = publishedBranchReceived(branch)

      expect(actual).to.deep.equal({
        type: publishedBranchReceivedType,
        branch,
      })
    })

    it("exports its type", () => {
      expect(publishedBranchReceivedType).to.equal("SITE_PUBLISHED_BRANCH_RECEIVED")
    })
  })

  describe("published branches received", () => {
    it("constructs properly", () => {
      const branches = ["Branch 1", "Branch 2"]

      const actual = publishedBranchesReceived(branches)

      expect(actual).to.deep.equal({
        type: publishedBranchesReceivedType,
        branches: branches,
      })
    })

    it("exports its type", () => {
      expect(publishedBranchesReceivedType).to.equal("SITE_PUBLISHED_BRANCHES_RECEIVED")
    })
  })
})
