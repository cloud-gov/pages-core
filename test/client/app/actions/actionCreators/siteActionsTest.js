import { expect } from "chai";
import { sitesReceived, sitesReceivedType } from "../../../../../assets/app/actions/actionCreators/siteActions";

describe("sitesReceived actionCreator", () => {
  it("constructs properly", () => {
    const sites = [{
      something: "here"
    }];
    
    const actual = sitesReceived(sites);

    expect(actual).to.deep.equal({
      type: sitesReceivedType,
      sites
    });
  });

  it("exports its type", () => {
    expect(sitesReceivedType).to.equal("SITES_RECEIVED");
  });
});
