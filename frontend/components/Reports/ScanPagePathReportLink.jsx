import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const ScanPagePathAndReportLink = ({ pagePath, pageURL = false, reportLink }) => (
  <div className="grid-row flex-align-center">
    <span className="grid-col-12 tablet:grid-col-auto font-mono-2xs margin-right-1">
      {pagePath}
    </span>

    {pageURL && (
      <span className="grid-col-12 tablet:grid-col-fill">
        <a className="usa-link font-body-3xs text-no-wrap margin-right-1" target="_blank" aria-label="open scanned page in a new window," title="open scanned page in a new window" href={pageURL} rel="noreferrer">
          open page
          <svg className="usa-icon text-ttop" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
          </svg>
        </a>
      </span>
    )}
    <span className="grid-col-12 tablet:grid-col-auto flex-align-self-end margin-y-1 tablet:margin-y-0">
      <Link className="usa-link font-body-2xs text-bold text-no-wrap" to={reportLink} path="relative" title={`Full results for ${pagePath}`}>
        View report
      </Link>
    </span>
  </div>
);

ScanPagePathAndReportLink.propTypes = {
  reportLink: PropTypes.string.isRequired,
  pagePath: PropTypes.string.isRequired,
  pageURL: PropTypes.string,
};

export default ScanPagePathAndReportLink;
