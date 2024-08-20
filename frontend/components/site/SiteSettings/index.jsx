import React from 'react';
import { useSelector } from 'react-redux';
import {
  useParams, useNavigate, useLocation,
} from 'react-router-dom';

import BranchConfigs from './BranchConfigs';
import ReportConfigs from './ReportConfigs';
import AdvancedSiteSettings from './AdvancedSiteSettings';
import EnvironmentVariables from './EnvironmentVariables';
import siteActions from '../../../actions/siteActions';
import { currentSite } from '../../../selectors/site';
import globals from '../../../globals';

function SiteSettings() {
  const { id } = useParams();
  const { hash } = useLocation();
  const site = useSelector(state => currentSite(state.sites, id));
  const navigate = useNavigate();

  if (!site) {
    return null;
  }

  function handleDelete() {
    // eslint-disable-next-line no-alert
    if (
      // eslint-disable-next-line no-alert
      window.confirm(
        `${site.owner}/${site.repository}\nAre you sure you want to delete this site for all users? This action will also delete all site builds and take down the live site, if published.`
      )
    ) {
      return siteActions
        .deleteSite(site.id)
        .then(() => siteActions.fetchSites())
        .then(() => navigate('/sites'));
    }
    return Promise.resolve();
  }

  function handleUpdate(values) {
    siteActions.updateSite(site, values);
  }

  const advancedInitialValues = {
    engine: site.engine,
  };

  return (
    <div>
      <p>
        See our documentation site for more about
        {' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          title={`${globals.APP_NAME} documentation on settings`}
          href="https://cloud.gov/pages/documentation/#managing-site-settings"
        >
          these settings
        </a>
        {' '}
        or
        {' '}
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
      <BranchConfigs siteId={site.id} hash={hash} />
      <AdvancedSiteSettings
        initialValues={advancedInitialValues}
        onDelete={handleDelete}
        onSubmit={handleUpdate}
      />

      <EnvironmentVariables siteId={site.id} />
      <ReportConfigs siteId={site.id} />
    </div>
  );
}

export { SiteSettings };
export default SiteSettings;
