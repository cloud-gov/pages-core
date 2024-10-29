const publishedFilesFetchStartedType = 'SITE_PUBLISHED_FILES_FETCH_STARTED';
const publishedFilesReceivedType = 'SITE_PUBLISHED_FILES_RECEIVED';

const publishedFilesFetchStarted = () => ({
  type: publishedFilesFetchStartedType,
});

const publishedFilesReceived = (files) => ({
  type: publishedFilesReceivedType,
  files,
});

export {
  publishedFilesFetchStartedType,
  publishedFilesFetchStarted,
  publishedFilesReceivedType,
  publishedFilesReceived,
};
