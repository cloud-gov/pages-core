import { expect } from "chai";
import {
  sitesReceived, sitesReceivedType,
  siteAdded, siteAddedType,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteFileContentReceived, siteFileContentReceivedType,
  siteAssetsReceived, siteAssetsReceivedType,
  siteFilesReceived, siteFilesReceivedType,
  siteConfigsReceived, siteConfigsReceivedType,
  siteBranchesReceived, siteBranchesReceivedType
} from "../../../../../assets/app/actions/actionCreators/siteActions";

describe("siteActions actionCreators", () => {
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

  describe("siteFilesReceived", () => {
    it("constructs properly", () => {
      const siteId = "tk421";
      const files = [{name: 'fileA'},{name: 'radfile1'}];

      const actual = siteFilesReceived(siteId, files);

      expect(actual).to.deep.equal({
        type: siteFilesReceivedType,
        siteId,
        files
      });
    });

    it("exports its type", () => {
      expect(siteFilesReceivedType).to.equal("SITE_FILES_RECEIVED");
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

  describe("siteConfigsReceived", () => {
    it("constructs properly", () => {
      const siteId = "tk421";
      const configs = {
        something: "could be anything",
        except: "when it isn't"
      };

      const actual = siteConfigsReceived(siteId, configs);

      expect(actual).to.deep.equal({
        type: siteConfigsReceivedType,
        siteId,
        configs
      });
    });

    it("exports its type", () => {
      expect(siteConfigsReceivedType).to.equal("SITE_CONFIGS_RECEIVED");
    });
  });


  describe("siteBranchesReceived", () => {
    it("constructs properly", () => {
      const siteId = "tk421";
      const branches = {
        something: "could be anything",
        except: "when it isn't"
      };

      const actual = siteBranchesReceived(siteId, branches);

      expect(actual).to.deep.equal({
        type: siteBranchesReceivedType,
        siteId,
        branches
      });
    });

    it("exports its type", () => {
      expect(siteBranchesReceivedType).to.equal("SITE_BRANCHES_RECEIVED");
    });
  });

});
