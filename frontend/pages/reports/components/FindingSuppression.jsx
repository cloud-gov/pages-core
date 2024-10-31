import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import api from '@util/federalistApi';
import notificationActions from '@actions/notificationActions';

function FindingSuppression({
  ruleId = '',
  suppressed = false,
  suppressedBy = null,
  siteId,
  sbtId,
  sbtType,
  sbtCustomRules = [],
}) {
  const [customerRules, setCustomerRules] = useState(sbtCustomRules);
  const willBeSuppressed = customerRules.find(r => r.id === ruleId);

  function handleUpdate(newRules) {
    return api.updateSiteBuildTask(siteId, sbtId, { rules: newRules })
      .then(() => notificationActions.success('Successfully saved report configuration.'))
      .catch(() => notificationActions.success('Error saving report configuration.'));
  }

  function addNewRule() {
    const newRule = { id: ruleId, type: sbtType };
    setCustomerRules(customerRules.concat([newRule]));
    handleUpdate(customerRules.concat([newRule]));
  }

  function deleteRule() {
    const newRules = customerRules.filter(r => r.id !== ruleId);
    setCustomerRules(newRules);
    handleUpdate(newRules);
  }
  return (
    <>
      { !suppressed && willBeSuppressed && (
        <p className="font-body-sm text-italic">
          Your configuration will suppress this finding in future reports.
          {' '}
          <button 
            type="button" 
            onClick={() => deleteRule()} 
            className="usa-link usa-button--unstyled text-italic"
          >Cancel suppression.</button>
        </p>
      )}
      { !suppressed && !willBeSuppressed && (
        <p className="font-body-sm text-italic">
          False positive?
          {' '}
          <button 
              type="button" 
              onClick={() => addNewRule()} 
              className="usa-link usa-button--unstyled text-italic"
            >
            Click here
          </button>
          {' '}
          to suppress this result in future reports.
        </p>
      )}
      {suppressed && (
        <section 
          className="
            usa-alert 
            usa-alert--info 
            usa-alert--suppressed 
            padding-y-1
            margin-top-3
          ">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">
              This result was suppressed by&nbsp;
              {suppressedBy || 'customer criteria'}
              .
            </h4>
            { suppressedBy !== 'Pages' && willBeSuppressed && (
              <p className="font-body-sm text-italic">
                Need to re-enable this rule?
                {' '}
                <button 
                  type="button"
                  onClick={() => deleteRule()} 
                  className="usa-link usa-button--unstyled text-italic"
                >Click here</button>
                {' '}
                to stop suppressing this result in future reports.
              </p>
            )}
            { suppressedBy !== 'Pages' && !willBeSuppressed && (
              <p className="font-body-sm text-italic">
                This finding will not be suppressed in future reports.
                {' '}
                <button 
                  type="button" 
                  onClick={() => addNewRule()} 
                  className="usa-link usa-button--unstyled text-italic"
                >
                  Click here
                </button>
                {' '}
                to continue suppressing this finding.
              </p>
            )}
            <div className="usa-alert__text">
              <details className="margin-top-3">
                <summary className="">
                  Why was this result&nbsp;
                  <b>suppressed</b>
                  ?
                </summary>
                <p>
                  { /* eslint-disable-next-line max-len */}
                  { suppressedBy && 'Pages automatically suppresses certain results in this report which are irrelevant for statically hosted websites, based on unconfigurable server settings, or frequently produce ‘false positive’ findings for our customers. '}
                  { /* eslint-disable-next-line max-len */}
                  { (!suppressedBy || suppressedBy === 'multiple criteria') && 'Customers can specify criteria to suppress during report generation to silence ‘false positive’ results.'}
                  { ' ' /* eslint-disable-next-line max-len */}
                  <b>While still visible in the report, the suppressed results don’t count towards your total issue count.</b>
                  { ' ' /* eslint-disable-next-line max-len */}
                  Review the report rules and criteria that are suppressed during report generation in your
                  { ' ' /* eslint-disable-next-line max-len */}
                  <Link reloadDocument to={`/sites/${siteId}/settings`} className="usa-link">Site Settings Report Configuration</Link>
                  .
                </p>
                <p>
                  For a full list of what Pages excludes from your results, review the
                  {' '}
                  <Link to="https://cloud.gov/pages/documentation/automated-site-reports/#configuration" className="usa-link">
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
  sbtId: PropTypes.number.isRequired,
  sbtType: PropTypes.string.isRequired,
  suppressed: PropTypes.bool,
  suppressedBy: PropTypes.string,
  siteId: PropTypes.number.isRequired,
   
  sbtCustomRules: PropTypes.array,
};

export default FindingSuppression;
export { FindingSuppression };
