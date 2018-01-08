import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  publishedFilesFetchStarted as createPublishedFilesFetchStartedAction,
  publishedFilesReceived as createPublishedFilesReceivedAction,
} from "./actionCreators/publishedFileActions";

const dispatchPublishedfilesFetchStartedAction = () => {
  dispatch(createPublishedFilesFetchStartedAction())
}

const dispatchPublishedFilesReceivedAction = files => {
  dispatch(createPublishedFilesReceivedAction(files))
}

export default {
  fetchPublishedFiles(site, branch) {
    dispatchPublishedfilesFetchStartedAction()
    return api.fetchPublishedFiles(site, branch)
      .then(dispatchPublishedFilesReceivedAction)
  },
};
