import { expect } from "chai";
import fixture from "../../../../assets/app/actions/findShaForDefaultBranch";

describe("findShaForDefaultBranch", () => {
  it("finds the sha associated with the commit associated with the default branch of a site.", () => {
    const sha = "75423682376cfeecscrcsaesd";
    const defaultBranchName = "deefault";
    const site = {
      defaultBranch: defaultBranchName,
      branches: [
        { name: "dare",
          ignored: "yes"
        },
        { name: "foo",
          yep: "don't care about you either"
        },
        {
          name: defaultBranchName,
          hi: "This is the branch with a sha",
          commit: {
            sha: sha
          }
        },
        {
          name: "extra",
          ignored: "this too"
        }
      ]
    };
    
    const actual = fixture(site);

    expect(actual).to.equal(sha);
  });
});
