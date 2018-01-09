/* global window:true */
import React from 'react';
import autoBind from 'react-autobind';

import { SITE } from '../../../propTypes';
import ExpandableArea from '../../ExpandableArea';
import BasicSiteSettings from './BasicSiteSettings';
import AdvancedSiteSettings from './AdvancedSiteSettings';
import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: SITE,
};

const defaultProps = {
  site: null,
};


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

    const advancedInitialValues = {
      engine: site.engine,
      config: site.config || '',
      demoConfig: site.demoConfig || '',
      previewConfig: site.previewConfig || '',
    };

    return (
      <div>
        <p>
          See our documentation site for more about
          { ' ' }
          <a
            target="_blank"
            rel="noopener noreferrer"
            title="Federalist documentation on settings"
            href="https://federalist-docs.18f.gov/pages/using-federalist/#managing-site-settings"
          >
            these settings
          </a>
          { ' ' }
          or
          { ' ' }
          <a
            target="_blank"
            rel="noopener noreferrer"
            title="Federalist documentation on previews"
            href="https://federalist-docs.18f.gov/pages/using-federalist/previews/"
          >
            viewing site previews
          </a>.
        </p>
        <BasicSiteSettings
          initialValues={basicInitialValues}
          onSubmit={this.onSubmit}
        />

        <ExpandableArea title="Advanced settings">
          <AdvancedSiteSettings
            initialValues={advancedInitialValues}
            onDelete={this.onDelete}
            onSubmit={this.onSubmit}
          />
        </ExpandableArea>
      </div>
    );
  }
}

SiteSettings.propTypes = propTypes;
SiteSettings.defaultProps = defaultProps;

export default SiteSettings;
