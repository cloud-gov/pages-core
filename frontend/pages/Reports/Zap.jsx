import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import About from './about';
import ScanNav from './ScanNav';
import ScanFindings from './ScanResults';
import ScanFindingsSummary from './ScanResultsSummary';
import BackToTopButton from './BackToTopButton';
import * as utils from './utils'


const buildId = 'buildId'
const siteId = 'siteId';
export default function Zap({ data }) {
  const scanTitle = "Vulnerability";
  const pageTitle = `Pages | ${scanTitle} scan report for ${data.site['@name']} on ${data.generated} for build id ${buildId}`;

  let navGroups = [...utils.severity['zap']].map(group => ({
      ...group, 
      usePill: true,
      count: data.site.groupedAlerts[group?.riskCode].length || 0
    })
  );
  navGroups.push(
    {
      label: 'Total results',
      count: data.site.alerts?.length
    },
    {
      label: 'All unresolved warnings',
      count: data.site?.issueCount,
      boldMe: true
    }
  )

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
            {data.site['@name']}
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
            generated={data.generated}
            buildId={buildId}
            groups={navGroups}
          />
        </section>
        <div className="tablet:grid-col tablet:margin-left-4">
          <div>
            <ScanFindingsSummary findings={data.site.alerts} />
            <ScanFindings
              alerts={data.site.alerts}
              groupedAlerts={data.site.groupedAlerts}
              site={data.site}
            />
          </div>
          <About scanType={'zap'} siteId={siteId} />
        </div>
      </div>
      <BackToTopButton />
    </>
  );
};

Zap.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
