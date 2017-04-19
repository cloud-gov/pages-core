import { expect } from "chai";
import proxyquire from "proxyquire";

proxyquire.noCallThru();

describe("publishedFilesReducer", () => {
  let fixture
  const PUBLISHED_FILES_RECEIVED = "published files received"

  beforeEach(() => {
    fixture = proxyquire("../../../frontend/reducers/publishedFiles", {
      "../actions/actionCreators/publishedFileActions": {
        publishedFilesReceivedType: PUBLISHED_FILES_RECEIVED,
      }
    }).default
  })

  it("ignores other actions and returns an empty array", () => {
    const FILES = ["File 1", "File 2"]

    const actual = fixture(undefined, {
      files: FILES,
      type: "the wrong type",
    })

    expect(actual).to.deep.equal([])
  })

  it("records the files received in the action", () => {
    const FILES = ["File 1", "File 2"]

    const actual = fixture([], {
      type: PUBLISHED_FILES_RECEIVED,
      files: FILES,
    })

    expect(actual).to.deep.equal(FILES)
  })

  it("overrides the files received in the action", () => {
    const FILES = ["FILE 1", "FILE 2"]

    const actual = fixture(["FILE 3"], {
      type: PUBLISHED_FILES_RECEIVED,
      files: FILES,
    })

    expect(actual).to.deep.equal(FILES)
  })
})
