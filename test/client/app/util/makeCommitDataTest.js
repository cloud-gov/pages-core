import { expect } from "chai";
import { stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("makeCommitData", () => {
  let addPathToSite;
  let uploadFileToSite;
  let encodeB64;

  const path = "/what/is/this/path/of/which/you/speak";
  const content = {
    something: "here",
    might: "be",
    or: "maybe not"
  };
  const encodedContent = "blah";
  const branch = "branch-o-rama";

  beforeEach(() => {
    encodeB64 = stub();
    const fixture = proxyquire("../../../../assets/app/util/makeCommitData", {
      "./encoding": {
        encodeB64: encodeB64
      }
    });
    addPathToSite = fixture.addPathToSite;
    uploadFileToSite = fixture.uploadFileToSite;
  });

  describe("addPathToSite", () => {
    it("creates an add path to site commit with the default message, no sha, and the site's specified branch", () => {
      const site = {
        id: "wee",
        branch: branch,
        could: "be anything"
      };
      const expectedCommit = {
        path: path,
        message: `Adds ${path} to project`,
        content: encodedContent,
        branch: branch
      };
      encodeB64.withArgs(content).returns(encodedContent);

      const actual = addPathToSite(site, path, content);

      expect(actual).to.deep.equal(expectedCommit);
    });

    it("creates an add path to site commit with the default message, no sha, and the site's default branch", () => {
      const site = {
        id: "wee",
        defaultBranch: branch,
        could: "be anything"
      };
      const expectedCommit = {
        path: path,
        message: `Adds ${path} to project`,
        content: encodedContent,
        branch: branch
      };
      encodeB64.withArgs(content).returns(encodedContent);

      const actual = addPathToSite(site, path, content);

      expect(actual).to.deep.equal(expectedCommit);
    });

    it("creates an add path to site commit with the default message, a specified sha, and the site's specified branch", () => {
      const sha = "638686873166f1f7ffbbcb";
      const site = {
        id: "wee",
        branch: branch,
        could: "be anything"
      };
      const expectedCommit = {
        path: path,
        message: `Adds ${path} to project`,
        content: encodedContent,
        branch: branch,
        sha: sha
      };
      encodeB64.withArgs(content).returns(encodedContent);

      const actual = addPathToSite(site, path, content, undefined, sha);

      expect(actual).to.deep.equal(expectedCommit);
    });

    it("creates an add path to site commit with the specified message, a specified sha, and the site's specified branch", () => {
      const sha = "638686873166f1f7ffbbcb";
      const message = "whale shark";
      const site = {
        id: "wee",
        branch: branch,
        defaultBranch: "ignore me",
        could: "be anything"
      };
      const expectedCommit = {
        path: path,
        message: message,
        content: encodedContent,
        branch: branch,
        sha: sha
      };
      encodeB64.withArgs(content).returns(encodedContent);

      const actual = addPathToSite(site, path, content, message, sha);

      expect(actual).to.deep.equal(expectedCommit);
    });
  });

  describe("uploadFileToSite", () => {
    const filename = "/help/him/find/the/funk";
    
    it("creates an upload file to site commit with no sha", () => {
      const expectedCommit = {
        message: `Uploads ${filename} to project`,
        content: content
      };

      const actual = uploadFileToSite(filename, content);

      expect(actual).to.deep.equal(expectedCommit);
    });
    
    it("creates an upload file to site commit with a sha", () => {
      const sha = "cebbedabbcebbdcbbaebdabcbbed7dnneccdceaedeafff9";
      const expectedCommit = {
        message: `Uploads ${filename} to project`,
        content: content,
        sha: sha
      };

      const actual = uploadFileToSite(filename, content, sha);

      expect(actual).to.deep.equal(expectedCommit);
    });
  });
});
