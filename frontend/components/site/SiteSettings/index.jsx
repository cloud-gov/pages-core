/* global window:true */
import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import ExpandableArea from '../../ExpandableArea';
import BasicSiteSettings from './BasicSiteSettings';
import AdvancedSiteSettings from './AdvancedSiteSettings';
import EnvironmentVariables from './EnvironmentVariables';
import siteActions from '../../../actions/siteActions';
import { currentSite } from '../../../selectors/site';
import { getOrgById } from '../../../selectors/organization';
import globals from '../../../globals';

function SiteSettings() {
  const { id } = useParams();
  const site = useSelector(state => currentSite(state.sites, id));
  const organization = useSelector(state => getOrgById(state.organizations, site.organizationId));

  if (!site) {
    return null;
  }

  function handleDelete() {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${site.owner}/${site.repository}\nAre you sure you want to delete this site for all users? This action will also delete all site builds and take down the live site, if published.`)) {
      return siteActions.deleteSite(site.id);
    }
    return Promise.resolve();
  }

  function handleUpdate(values) {
    siteActions.updateSite(site, values);
  }

  const basicInitialValues = {
    defaultBranch: site.defaultBranch || '',
    domain: site.domain || '',
    demoBranch: site.demoBranch || '',
    demoDomain: site.demoDomain || '',
    canEditLiveUrl: site.canEditLiveUrl,
    canEditDemoUrl: site.canEditDemoUrl,
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
          title={`${globals.APP_NAME} documentation on settings`}
          href="https://cloud.gov/pages/documentation/#managing-site-settings"
        >
          these settings
        </a>
        { ' ' }
        or
        { ' ' }
        <a
          target="_blank"
          rel="noopener noreferrer"
          title={`${globals.APP_NAME} documentation on previews`}
          href="https://cloud.gov/pages/documentation/previews/"
        >
          viewing site previews
        </a>
        .
      </p>
      <BasicSiteSettings
        isSandbox={organization?.isSandbox}
        initialValues={basicInitialValues}
        onSubmit={handleUpdate}
      />
      <ExpandableArea title="Advanced settings">
        <AdvancedSiteSettings
          siteId={site.id}
          initialValues={advancedInitialValues}
          onDelete={handleDelete}
          onSubmit={handleUpdate}
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

export { SiteSettings };
export default SiteSettings;
