/* global window:true */
import React from 'react';
import { connect } from 'react-redux';

import { SITE, ORGANIZATION } from '../../../propTypes';
import ExpandableArea from '../../ExpandableArea';
import BasicSiteSettings from './BasicSiteSettings';
import AdvancedSiteSettings from './AdvancedSiteSettings';
import EnvironmentVariables from './EnvironmentVariables';
import siteActions from '../../../actions/siteActions';
import { currentSite } from '../../../selectors/site';
import { getOrgById } from '../../../selectors/organization';

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleDelete() {
    const { site } = this.props;
    // eslint-disable-next-line no-alert
    if (window.confirm(`${site.owner}/${site.repository}\nAre you sure you want to delete this site for all users? This action will also delete all site builds and take down the live site, if published.`)) {
      return siteActions.deleteSite(site.id);
    }

    return Promise.resolve();
  }

  handleUpdate(values) {
    const { site } = this.props;
    siteActions.updateSite(site, values);
  }

  render() {
    const { site, organization } = this.props;

    if (!site) {
      return null;
    }

    const basicInitialValues = {
      defaultBranch: site.defaultBranch || '',
      domain: site.domain || '',
      demoBranch: site.demoBranch || '',
      demoDomain: site.demoDomain || '',
    };

    const advancedInitialValues = {
      engine: site.engine,
      defaultConfig: site.defaultConfig || '',
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
            href="https://federalist.18f.gov/documentation/#managing-site-settings"
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
            href="https://federalist.18f.gov/documentation/previews/"
          >
            viewing site previews
          </a>
          .
        </p>
        <BasicSiteSettings
          isSandbox={organization?.isSandbox}
          initialValues={basicInitialValues}
          onSubmit={this.handleUpdate}
        />
        <ExpandableArea title="Advanced settings">
          <AdvancedSiteSettings
            siteId={site.id}
            initialValues={advancedInitialValues}
            onDelete={this.handleDelete}
            onSubmit={this.handleUpdate}
          />
        </ExpandableArea>
        <ExpandableArea title="Environment variables">
          <EnvironmentVariables
            siteId={site.id}
          />
        </ExpandableArea>
      </div>
    );
  }
}

SiteSettings.propTypes = {
  site: SITE,
  organization: ORGANIZATION,
};

SiteSettings.defaultProps = {
  site: null,
  organization: null,
};

const mapStateToProps = ({ sites, organizations }, { id }) => {
  const site = currentSite(sites, id);
  const organization = getOrgById(organizations, site.organizationId);
  return ({
    site,
    organization,
  });
};

export { SiteSettings };
export default connect(mapStateToProps)(SiteSettings);
