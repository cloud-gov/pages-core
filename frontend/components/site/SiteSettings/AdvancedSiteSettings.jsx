import React from 'react';
import PropTypes from 'prop-types';

import AdvancedSiteSettingsForm from './AdvancedSiteSettingsForm';


export const AdvancedSiteSettings = ({
  siteId,
  initialValues,
  onDelete,
  onSubmit,
}) => (
  <div>
    <AdvancedSiteSettingsForm
      siteId={siteId}
      initialValues={initialValues}
      onDelete={onDelete}
      onSubmit={onSubmit}
    />
  </div>
);

AdvancedSiteSettings.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  siteId: PropTypes.number.isRequired,
  // initialValues is what the initial form values are based on
  initialValues: PropTypes.shape({
    engine: PropTypes.string.isRequired,
    config: PropTypes.string,
    demoConfig: PropTypes.string,
    previewConfig: PropTypes.string,
  }).isRequired,
};

export default AdvancedSiteSettings;
