/* global window:true */
import React from 'react';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';

import { SITE } from '../../../propTypes';
import ExpandableArea from '../../ExpandableArea';
import BasicSiteSettings from './BasicSiteSettings';
import AdvancedSiteSettings from './AdvancedSiteSettings';
import CopyRepoForm from './CopyRepoForm';
import siteActions from '../../../actions/siteActions';

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this, 'handleUpdate', 'handleDelete', 'handleCopySite');
  }

  handleDelete(event) {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this site for all users? This action will also delete all site builds and take down the live site, if published.')) {
      siteActions.deleteSite(this.props.site.id);
    }

    event.preventDefault();
  }

  handleUpdate(values) {
    siteActions.updateSite(this.props.site, values);
  }

  handleCopySite({ newBaseBranch, newRepoName, targetOwner }) {
    const { site } = this.props;
    const siteParams = {
      owner: targetOwner,
      repository: newRepoName,
      defaultBranch: newBaseBranch,
      engine: site.engine,
      source: {
        owner: site.owner,
        repo: site.repository,
      },
    };

    siteActions.addSite(siteParams);
  }

  render() {
    const { site } = this.props;

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
        <ExpandableArea title="Copy site">
          <CopyRepoForm onSubmit={this.handleCopySite} />
        </ExpandableArea>
      </div>
    );
  }
}

SiteSettings.propTypes = {
  site: SITE,
};

SiteSettings.defaultProps = {
  site: null,
};

const mapStateToProps = ({ sites }) => ({
  site: sites.currentSite,
});

export { SiteSettings };
export default connect(mapStateToProps)(SiteSettings);
