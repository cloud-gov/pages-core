import { expect } from 'chai';

import reducer from '../../../frontend/reducers/showAddNewSiteFields';

import {
  showAddNewSiteFieldsType as ADD_NEW_SITE_FIELDS_SHOW,
  hideAddNewSiteFieldsType as ADD_NEW_SITE_FIELDS_HIDE,
} from '../../../frontend/actions/actionCreators/addNewSiteFieldsActions';

describe('showAddNewSiteFields reducer', () => {
  it('has an initial state of "false"', () => {
    const state = reducer(undefined, { type: 'bloop' });
    expect(state).to.be.false;
  });

  it('returns true when action is ADD_NEW_SITE_FIELDS_SHOW', () => {
    let state = reducer(undefined, {
      type: ADD_NEW_SITE_FIELDS_SHOW,
    });
    expect(state).to.be.true;

    state = reducer(false, {
      type: ADD_NEW_SITE_FIELDS_SHOW,
    });
    expect(state).to.be.true;
  });

  it('returns false when action is ADD_NEW_SITE_FIELDS_HIDE', () => {
    let state = reducer(undefined, {
      type: ADD_NEW_SITE_FIELDS_HIDE,
    });
    expect(state).to.be.false;

    state = reducer(true, {
      type: ADD_NEW_SITE_FIELDS_HIDE,
    });
    expect(state).to.be.false;
  });

  it('ignores other actions', () => {
    const state = reducer('do not change', { type: 'coffee cup' });
    expect(state).to.equal('do not change');
  });
});
