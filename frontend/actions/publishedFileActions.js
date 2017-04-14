import api from '../util/federalistApi';
import { dispatch } from '../store';

import {
  publishedFilesReceived as createPublishedFilesReceivedAction,
} from "./actionCreators/publishedFileActions";

const dispatchPublishedFilesReceivedAction = files => {
  dispatch(createPublishedFilesReceivedAction(files))
}

export default {
  fetchPublishedFiles(site, branch) {
    return api.fetchPublishedFiles(site, branch)
      .then(dispatchPublishedFilesReceivedAction)
  },
};
