import { expect } from "chai";
import {
  buildsReceived, buildsReceivedType
} from "../../../../../assets/app/actions/actionCreators/buildActions";

describe("buildActions actionCreators", () => {
  describe("builds received", () => {
    it("constructs properly", () => {
      const builds = {
        a: "bee",
        see: "dee"
      };
      
      const actual = buildsReceived(builds);
      
      expect(actual).to.deep.equal({
        type: buildsReceivedType,
        builds
      });
    });
    
    it("exports its type", () => {
      expect(buildsReceivedType).to.equal("BUILDS_RECEIVED");
    });
  });
});
