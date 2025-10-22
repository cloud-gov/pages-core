import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

function FindingSuppression({
  ruleId = '',
  suppressed = false,
  suppressedBy = null,
  siteId,
  willBeSuppressed,
  addNewRule,
  deleteRule,
}) {
  const pagesSuppression = `
    Pages automatically suppresses certain results in this report which are irrelevant
    for  statically hosted websites, based on unconfigurable server settings, or
    frequently produce ‘false positive’ findings for our customers.
    `;
  const customerSuppression = `
    Customers can specify criteria to suppress during report generation to silence
    ‘false positive’ results.
    `;

  const suppressedClasses = `
    usa-alert usa-alert--info usa-alert--suppressed padding-y-1 margin-top-3
  `;

  return (
    <>
      {!suppressed && willBeSuppressed && (
        <p className="font-body-sm text-italic">
          Your configuration will suppress this finding in future reports.{' '}
          <button
            type="button"
            onClick={() => deleteRule(ruleId)}
            className="usa-link usa-button--unstyled text-italic"
          >
            Cancel suppression.
          </button>
        </p>
      )}
      {!suppressed && !willBeSuppressed && (
        <p className="font-body-sm text-italic">
          False positive?{' '}
          <button
            type="button"
            onClick={() => addNewRule(ruleId)}
            className="usa-link usa-button--unstyled text-italic"
          >
            Click here
          </button>{' '}
          to suppress this result in future reports.
        </p>
      )}
      {suppressed && (
        <section className={suppressedClasses}>
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">
              This result was suppressed by&nbsp;
              {suppressedBy || 'customer criteria'}.
            </h4>
            {suppressedBy !== 'Pages' && willBeSuppressed && (
              <p className="font-body-sm text-italic">
                Need to re-enable this rule?{' '}
                <button
                  type="button"
                  onClick={() => deleteRule(ruleId)}
                  className="usa-link usa-button--unstyled text-italic"
                >
                  Click here
                </button>{' '}
                to stop suppressing this result in future reports.
              </p>
            )}
            {suppressedBy !== 'Pages' && !willBeSuppressed && (
              <p className="font-body-sm text-italic">
                This finding will not be suppressed in future reports.{' '}
                <button
                  type="button"
                  onClick={() => addNewRule(ruleId)}
                  className="usa-link usa-button--unstyled text-italic"
                >
                  Click here
                </button>{' '}
                to continue suppressing this finding.
              </p>
            )}
            <div className="usa-alert__text">
              <details className="margin-top-3">
                <summary className="">
                  Why was this result&nbsp;
                  <b>suppressed</b>?
                </summary>
                <p>
                  {suppressedBy && pagesSuppression + ' '}
                  {(!suppressedBy || suppressedBy === 'multiple criteria') &&
                    customerSuppression + ' '}
                  <b>
                    While still visible in the report, the suppressed results don’t count
                    towards your total issue count.
                  </b>{' '}
                  Review the report rules and criteria that are suppressed during report
                  generation in your &nbsp;
                  <Link
                    reloadDocument
                    to={`/sites/${siteId}/settings`}
                    className="usa-link"
                  >
                    Site Settings Report Configuration
                  </Link>
                  .
                </p>
                <p>
                  {/* eslint-disable-next-line max-len */}
                  For a full list of what Pages excludes from your results, review the{' '}
                  <Link
                    to="https://docs.cloud.gov/pages/security-compliance/automated-site-reports/#configuration"
                    className="usa-link"
                  >
                    Automated Site Reports documentation
                  </Link>
                  .
                </p>
              </details>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

FindingSuppression.propTypes = {
  ruleId: PropTypes.string.isRequired,
  suppressed: PropTypes.bool,
  suppressedBy: PropTypes.string,
  siteId: PropTypes.number.isRequired,
  willBeSuppressed: PropTypes.bool,
  addNewRule: PropTypes.func,
  deleteRule: PropTypes.func,
};

export default FindingSuppression;
export { FindingSuppression };
