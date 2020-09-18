import {
  showAddNewSiteFieldsType as ADD_NEW_SITE_FIELDS_SHOW,
  hideAddNewSiteFieldsType as ADD_NEW_SITE_FIELDS_HIDE,
} from '../actions/actionCreators/addNewSiteFieldsActions';

const initialState = false;

export default function showAddNewSiteFields(state = initialState, action) {
  switch (action.type) {
    case ADD_NEW_SITE_FIELDS_SHOW:
      return true;
    case ADD_NEW_SITE_FIELDS_HIDE:
      return false;
    default:
      return state;
  }
}
