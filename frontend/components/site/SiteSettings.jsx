import React from 'react';
import autoBind from 'react-autobind';

import { SITE } from '../../propTypes';
import BasicSiteSettings from './BasicSiteSettings';
import AdvancedSiteSettings from './AdvancedSiteSettings';
import siteActions from '../../actions/siteActions';

const propTypes = {
  site: SITE,
  // TODO: Delete from route - githubBranches: GITHUB_BRANCHES,
};

const defaultProps = {
  site: null,
};

// TODO: make an accordion widget to wrap AdvancedSettings

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this, 'onSubmit', 'onDelete');
  }

  onDelete(event) {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this site? This action will also delete your site builds, including all previews.')) {
      siteActions.deleteSite(this.props.site.id);
    }

    event.preventDefault();
  }

  onSubmit(values) {
    siteActions.updateSite(this.props.site, values);
  }

  render() {
    if (!this.props.site) {
      return null;
    }

    const site = this.props.site;

    const basicInitialValues = {
      defaultBranch: site.defaultBranch || '',
      domain: site.domain || '',
      demoBranch: site.demoBranch || '',
      demoDomain: site.demoDomain || '',
    };

    return (
      <div>
        <BasicSiteSettings
          initialValues={basicInitialValues}
          onSubmit={this.onSubmit}
        />

        <hr />

        {/* TODO:
        <h4>Advanced Settings</h4>
        <div style={{ background: 'red' }}>
          <AdvancedSiteSettings
            site={this.props.site}
            onDelete={this.onDelete}
            onCancel={this.onCancel}
            onSubmit={this.onSubmit}
          />
        </div>
        */}
      </div>
    );
  }
}

SiteSettings.propTypes = propTypes;
SiteSettings.defaultProps = defaultProps;

export default SiteSettings;
