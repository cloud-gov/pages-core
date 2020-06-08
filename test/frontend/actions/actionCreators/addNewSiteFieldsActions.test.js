import { expect } from 'chai';

import {
  showAddNewSiteFields,
  showAddNewSiteFieldsType,
  hideAddNewSiteFields,
  hideAddNewSiteFieldsType,
} from '../../../../frontend/actions/actionCreators/addNewSiteFieldsActions';

describe('addNewSiteFieldsActions actionCreators', () => {
  it('showAddNewSiteFields()', () => {
    const action = showAddNewSiteFields();
    expect(showAddNewSiteFieldsType).to.exist;
    expect(action.type).to.equal(showAddNewSiteFieldsType);
  });

  it('hideAddNewSiteFields()', () => {
    const action = hideAddNewSiteFields();
    expect(hideAddNewSiteFieldsType).to.exist;
    expect(action.type).to.equal(hideAddNewSiteFieldsType);
  });
});
