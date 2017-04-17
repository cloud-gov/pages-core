import {
  publishedFilesFetchStartedType as PUBLISHED_FILES_FETCH_STARTED,
  publishedFilesReceivedType as PUBLISHED_FILES_RECEIVED,
} from "../actions/actionCreators/publishedFileActions";

const initialState = {
  isLoading: false,
}

export default function publishedFiles(state = initialState, action) {
  switch (action.type) {
  case PUBLISHED_FILES_FETCH_STARTED:
    return {
      isLoading: true,
    }
  case PUBLISHED_FILES_RECEIVED:
    return {
      isLoading: false,
      data: action.files,
    }
  default:
    return state;
  }
}
