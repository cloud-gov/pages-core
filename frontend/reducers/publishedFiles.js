import {
  publishedFilesReceivedType as PUBLISHED_FILES_RECEIVED,
} from "../actions/actionCreators/publishedFileActions";

export default function publishedFiles(state = [], action) {
  switch (action.type) {
  case PUBLISHED_FILES_RECEIVED:
    return action.files;
  default:
    return state;
  }
}
