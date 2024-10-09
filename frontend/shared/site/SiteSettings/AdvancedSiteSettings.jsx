import React from 'react';
import PropTypes from 'prop-types';

import AdvancedSiteSettingsForm from './AdvancedSiteSettingsForm';
import DeleteSiteForm from './DeleteSiteForm';
import ExpandableArea from '../../ExpandableArea';

export const AdvancedSiteSettings = ({ initialValues, onDelete, onSubmit }) => (
  <div className="grid-col-12">
    <div className="">
      <h3 className="font-heading-xl margin-top-4 margin-bottom-2">Advanced Settings</h3>
      <ExpandableArea bordered title="Site engine">
        <AdvancedSiteSettingsForm
          initialValues={initialValues}
          onSubmit={onSubmit}
        />
      </ExpandableArea>
      <ExpandableArea bordered title="Delete site">
        <DeleteSiteForm onSubmit={onDelete} />
      </ExpandableArea>
    </div>
  </div>
);

AdvancedSiteSettings.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
  }).isRequired,
};

export default AdvancedSiteSettings;
