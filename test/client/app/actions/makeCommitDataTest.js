import { expect } from "chai";
import { stub } from "sinon";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("makeCommitData", () => {
  let addPathToSite;
  let encodeB64;
  
  beforeEach(() => {
    encodeB64 = stub();
    const fixture = proxyquire("../../../../assets/app/actions/makeCommitData", {
      "../util/encoding": {
        encodeB64: encodeB64
      }
    });
    addPathToSite = fixture.addPathToSite;
  });

  it("creates an add path to site commit with the default message, no sha, and the site's specified branch", () => {
    const path = "/what/is/this/path/of/which/you/speak";
    const content = {
      something: "here",
      might: "be",
      or: "maybe not"
    };
    const encodedContent = "blah";
    const branch = "branch-o-rama";
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
    const path = "/what/is/this/path/of/which/you/speak";
    const content = {
      something: "here",
      might: "be",
      or: "maybe not"
    };
    const encodedContent = "blah";
    const branch = "branch-o-rama";
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
    const path = "/what/is/this/path/of/which/you/speak";
    const sha = "638686873166f1f7ffbbcb";
    const content = {
      something: "here",
      might: "be",
      or: "maybe not"
    };
    const encodedContent = "blah";
    const branch = "branch-o-rama";
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
    const path = "/what/is/this/path/of/which/you/speak";
    const sha = "638686873166f1f7ffbbcb";
    const message = "whale shark";
    const content = {
      something: "here",
      might: "be",
      or: "maybe not"
    };
    const encodedContent = "blah";
    const branch = "branch-o-rama";
    const site = {
      id: "wee",
      branch: branch,
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
