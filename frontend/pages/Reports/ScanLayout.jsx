import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import About from './about';
import ScanNav from './ScanNav';
import ScanFindings from './ScanFindings';
import ScanFindingsSummary from './ScanFindingsSummary';
import BackToTopButton from './BackToTopButton';
import * as utils from './utils'



const ScanLayout = ({ alerts = [], groupedAlerts = {}, site = {}, generated = '', buildId = '', scanType = null, siteId = '' }) => {
const scanTitle = scanType === "zap" ? "Vulnerability" : "Accessibility";
const pageTitle = `Pages | ${scanTitle} scan report for ${site['@name']} on ${generated} for build id ${buildId}`;
  useEffect(() => {
    document.title = pageTitle;
  }, []);

  return (
    <>
      <div className="grid-row">
        <h1 className="font-heading-xl grid-col padding-right-2">
          {scanTitle} 
          {' scan results for '}
          <br />
          <span className="font-code-lg text-normal text-primary-darker bg-accent-cool-lighter padding-x-05r narrow-mono">
            {site['@name']}
          </span>
        </h1>
        <span className="grid-col-auto inline-block margin-y-4">
          <a
            id="pages-logo"
            href="https://cloud.gov/pages"
            target="_blank"
            rel="noopener noreferrer"
            title="link to Pages homepage"
          >
            <img
              src="/images/logos/pages-logo-blue.svg"
              className="width-15"
              alt="Pages logo"
            />
          </a>
        </span>
      </div>
      <div className="grid-row border-top-1px padding-top-1">
        <section className="tablet:grid-col-auto">
          <ScanNav
            alerts={alerts}
            groupedAlerts={groupedAlerts}
            utils={utils}
            site={site}
            generated={generated}
            buildId={buildId}
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div>
            <ScanFindingsSummary alerts={alerts} />
            <ScanFindings
              alerts={alerts}
              groupedAlerts={groupedAlerts}
              site={site}
            />
          </div>
          <About scanType={scanType} siteId={siteId} />
        </div>
      </div>
      <BackToTopButton />
    </>
  );
};

export default ScanLayout;
ScanLayout.propTypes = {
  alerts: PropTypes.array.isRequired,
  groupedAlerts: PropTypes.object.isRequired,
  site: PropTypes.object.isRequired,
  generated: PropTypes.string.isRequired,
  buildId: PropTypes.string.isRequired,
  siteId: PropTypes.string.isRequired,
  scanType: PropTypes.string.isRequired,
};
