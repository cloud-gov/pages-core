const publishedFilesReceivedType = "SITE_PUBLISHED_FILES_RECEIVED"

const publishedFilesReceived = files => ({
  type: publishedFilesReceivedType,
  files,
})

export {
  publishedFilesReceivedType, publishedFilesReceived,
}
