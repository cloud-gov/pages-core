import React from 'react';
import PropTypes from 'prop-types';

import AdvancedSiteSettingsForm from './AdvancedSiteSettingsForm';
import DeleteSiteForm from './DeleteSiteForm';

export const AdvancedSiteSettings = ({
  initialValues,
  onDelete,
  onSubmit,
}) => (
  <div>
    <AdvancedSiteSettingsForm
      initialValues={initialValues}
      onSubmit={onSubmit}
    />
    <DeleteSiteForm onSubmit={onDelete} />
  </div>
);

AdvancedSiteSettings.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
    defaultConfig: PropTypes.string,
    demoConfig: PropTypes.string,
    previewConfig: PropTypes.string,
  }).isRequired,
};

export default AdvancedSiteSettings;
