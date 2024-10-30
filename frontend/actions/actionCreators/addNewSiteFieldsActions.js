const showAddNewSiteFieldsType = 'ADD_NEW_SITE_FIELDS_SHOW';
const hideAddNewSiteFieldsType = 'ADD_NEW_SITE_FIELDS_HIDE';

const showAddNewSiteFields = () => ({
  type: showAddNewSiteFieldsType,
});

const hideAddNewSiteFields = () => ({
  type: hideAddNewSiteFieldsType,
});

export {
  showAddNewSiteFields,
  showAddNewSiteFieldsType,
  hideAddNewSiteFields,
  hideAddNewSiteFieldsType,
};
