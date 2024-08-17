import React from 'react';

export default function ReportNotFound() {
  return (
    <div className="usa-prose padding-y-10">
      <h1>Report not found</h1>
      <p className="usa-intro">
        This report is not available.
      </p>
      <div className="margin-y-5">
        <ul className="usa-button-group">
          <li className="usa-button-group__item">
            <a href="/sites" className="usa-button">
              Return to your Pages sites
            </a>
          </li>
          <li className="usa-button-group__item">
            <button className="usa-button usa-button--outline" type="button">
              Contact Us
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
