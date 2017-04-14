import { expect } from "chai"
import { spy, stub } from "sinon"
import proxyquire from "proxyquire"

proxyquire.noCallThru()

describe("publishedFileActions", () => {
  let fixture
  let dispatch
  let publishedFilesReceivedActionCreator
  let fetchPublishedFiles

  beforeEach(() => {
    dispatch = spy()
    publishedFilesReceivedActionCreator = stub()

    fetchPublishedFiles = stub()

    fixture = proxyquire("../../../frontend/actions/publishedFileActions", {
      "./actionCreators/publishedFileActions": {
        publishedFilesReceived: publishedFilesReceivedActionCreator,
      },
      "../util/federalistApi": {
        fetchPublishedFiles: fetchPublishedFiles,
      },
      "../store": {
        dispatch: dispatch,
      },
    }).default
  })

  it("fetchPublishedFilees", done => {
    const files = ["File 1", "File 2"]
    const publishedFilesPromise = Promise.resolve(files)
    const action = { action: "action" }
    fetchPublishedFiles.withArgs().returns(publishedFilesPromise)
    publishedFilesReceivedActionCreator.withArgs(files).returns(action)

    const actual = fixture.fetchPublishedFiles()

    actual.then(() => {
      expect(dispatch.calledOnce).to.be.true
      expect(dispatch.calledWith(action)).to.be.true
      done()
    })
  })
})
