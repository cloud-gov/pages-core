import { expect } from "chai";
import {
  sitesReceived, sitesReceivedType,
  siteAdded, siteAddedType,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteFileContentReceived, siteFileContentReceivedType,
  siteAssetsReceived, siteAssetsReceivedType,
  siteFilesReceived, siteFilesReceivedType
} from "../../../../../assets/app/actions/actionCreators/siteActions";

describe("siteActions action creators", () => {
  describe("sitesReceived", () => {
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

  describe("siteAdded", () => {
    it("constructs properly", () => {
      const site = {
        something: "here"
      };
      
      const actual = siteAdded(site);

      expect(actual).to.deep.equal({
        type: siteAddedType,
        site
      });
    });

    it("exports its type", () => {
      expect(siteAddedType).to.equal("SITE_ADDED");
    });
  });
  
  describe("siteUpdated", () => {
    it("constructs properly", () => {
      const id = "tk421";
      const site = {
        something: "here",
        id: id
      };
      
      const actual = siteUpdated(site);

      expect(actual).to.deep.equal({
        type: siteUpdatedType,
        siteId: id,
        site
      });
    });

    it("exports its type", () => {
      expect(siteUpdatedType).to.equal("SITE_UPDATED");
    });
  });
  
  describe("siteUpdated", () => {
    it("constructs properly", () => {
      const siteId = "tk421";
      
      const actual = siteDeleted(siteId);

      expect(actual).to.deep.equal({
        type: siteDeletedType,
        siteId
      });
    });

    it("exports its type", () => {
      expect(siteDeletedType).to.equal("SITE_DELETED");
    });
  });
  
  describe("siteFileContentReceived", () => {
    it("constructs properly", () => {
      const siteId = "tk421";
      const fileContent = "this is something coming from a commit response, I hope.";
      
      const actual = siteFileContentReceived(siteId, fileContent);

      expect(actual).to.deep.equal({
        type: siteFileContentReceivedType,
        siteId,
        file: fileContent
      });
    });

    it("exports its type", () => {
      expect(siteFileContentReceivedType).to.equal("SITE_FILE_CONTENT_RECEIVED");
    });
  });

  describe("siteAssetsReceived", () => {
    it("constructs properly", () => {
      const siteId = "tk421";
      const assets = {
        something: "could be anything",
        except: "when it isn't"
      };
      
      const actual = siteAssetsReceived(siteId, assets);

      expect(actual).to.deep.equal({
        type: siteAssetsReceivedType,
        siteId,
        assets
      });
    });

    it("exports its type", () => {
      expect(siteAssetsReceivedType).to.equal("SITE_ASSETS_RECEIVED");
    });
  });
});
