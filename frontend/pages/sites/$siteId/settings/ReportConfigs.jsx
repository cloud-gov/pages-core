import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import api from '@util/federalistApi';
import { BUILD_SCAN_RULES } from '@util/scanConfig';
import { useDefaultScanRules } from '@hooks/useDefaultScanRules';
import { useSiteBuildTasks } from '@hooks/useSiteBuildTasks';
import notificationActions from '@actions/notificationActions';
import ExpandableArea from '@shared/ExpandableArea';
import { IconTrash, IconExternalLink } from '@shared/icons';
import LoadingIndicator from '@shared/LoadingIndicator';

function getRuleName(rule) {
  return BUILD_SCAN_RULES.find(r => r.id === rule.id)?.name;
}
function getRuleLink(rule) {
  return BUILD_SCAN_RULES.find(r => r.id === rule.id)?.url;
}
function ReportConfigs({ siteId: id }) {
  // TODO: maybe someday this needs to take siteBuildTask.branch into account

  const { siteBuildTasks, isLoading } = useSiteBuildTasks(id);

  // we use default scan rules
  // and customer scan rules from siteBuildTasks
  const { defaultScanRules } = useDefaultScanRules();
  const [customerRules, setCustomerRules] = useState([]);
  const [rulesSynced, setRulesSynced] = useState(false);

  useEffect(() => {
    setCustomerRules(
      siteBuildTasks.map(sbt => (sbt.metadata?.rules ? sbt.metadata.rules : [])).flat()
    );
    setRulesSynced(true);
  }, [siteBuildTasks]);

  function handleUpdate(siteBuildTask) {
    const typeRules = customerRules
      .filter(rule => rule.type === siteBuildTask.id)
      .filter(rule => rule.id.slice(0, 4) !== 'temp'); // don't save temp rules

    // assumed we've synced regardless of success so people can retry saving
    setRulesSynced(true);

    return api.updateSiteBuildTask(id, siteBuildTask.sbtId, { rules: typeRules })
      .then(() => notificationActions.success('Successfully saved report configuration.'))
      .catch(() => notificationActions.success('Error saving report configuration.'));
  }

  function addNewRule(index) {
    // start with pseudo-random ids to avoid key collisions
    // default to the first type
    const ruleUid = `temp-${Math.random().toString(36).slice(2)}`;
    const newRule = { id: ruleUid, type: siteBuildTasks[index].id };
    setCustomerRules(customerRules.concat([newRule]));
    // come back someday and set the newly added select to .focus() using refs
  }

  function updateRule(event, ruleId, prop) {
    const { value } = event.target;
    const newRules = customerRules.slice(0);
    const rule = newRules.find(r => r.id === ruleId);
    rule[prop] = prop === 'match'
      ? value.split(',').map(v => v.trim())
      : value;
    setRulesSynced(false);
    setCustomerRules(newRules);
  }

  function deleteRule(rule) {
    const newRules = customerRules.filter(r => r.id !== rule.id);
    setRulesSynced(false);
    setCustomerRules(newRules);
  }

  function availableRules(checkRule) {
    return BUILD_SCAN_RULES
      .filter(rule => rule.type === checkRule.type) // may not need this now
      .filter(rule => !customerRules.map(r => r.id).includes(rule.id) || rule.id === checkRule.id);
  }

  function selectRender(rule, options, prop, name) {
    return (
      <select
        name={name}
        id={`select-${rule.id}`}
        className="usa-select"
        value={rule[prop]}
        onChange={event => updateRule(event, rule.id, prop)}
        disabled={rule.source === 'Pages'}
      >
        <option value="" default>— Choose a rule — </option>
        {options
          .map(o => (
            <option
              key={o.id}
              value={o.id}
            >
              {o.name}
              {' '}
              (
              {o.id}
              )
            </option>
          ))}
      </select>
    );
  }

  function ruleRender(rule) {
    const isPagesRule = rule?.source === 'Pages';
    const customPlaceholder = '/assets class="ignore"';
    function pagesPlaceholder() {
      if (rule.match && Array.isArray(rule.match)) {
        return rule.match.map((match, i) => (
          <>
            { i === 0 ? '' : ', '}
            <code className="pages-suppressed-string" key="match">
              {match}
            </code>
          </>
        ));
      }
      return 'Pages suppresses all results for this rule';
    }
    return (
      (
        <tr key={rule.id} aria-labelledby={`rule-${rule.id}`} className={`rule-source--${rule.source}`}>
          <td>
            {rule.source !== 'Pages' ? (
              selectRender(rule, availableRules(rule), 'id', 'rules')
            ) : (
              <p>
                <b id={`rule-${rule.id}`}>{getRuleName(rule)}</b>
                {' '}
                (
                {rule.id}
                )
              </p>
            )}
            { rule && getRuleLink(rule)
              && (
              <span>
                <a
                  className="external-link"
                  href={getRuleLink(rule)}
                  title={getRuleName(rule)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more about this rule
                  <IconExternalLink />
                </a>
              </span>
              )}

          </td>
          {!isPagesRule && (
            <>
              <td>
                { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
                <label className="usa-sr-only" htmlFor={`${rule.id}-criteria`}>Criteria to match:</label>
                <input
                  className="usa-input"
                  id={`${rule.id}-criteria`}
                  type="text"
                  placeholder={customPlaceholder}
                  disabled={isPagesRule}
                  onChange={event => updateRule(event, rule.id, 'match')}
                  value={isPagesRule ? '' : rule.match?.join(', ')}
                />
              </td>
              <td className="has-button">
                { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
                <label className="usa-sr-only" htmlFor={`${rule.id}-delete`}>Delete this rule</label>
                <button id={`${rule.id}-delete`} className="margin-0 usa-button usa-button--secondary" aria-label={isPagesRule ? 'Cannot delete this rule' : 'Delete this rule'} type="button" onClick={() => deleteRule(rule)}>
                  <span className="usa-sr-only">Delete</span>
                  <IconTrash className="" aria-hidden />
                </button>
              </td>
            </>
          )}
          {isPagesRule && (
            <td colSpan="2">
              {pagesPlaceholder()}
            </td>
          )}
        </tr>
      )
    );
  }
  function helperText() {
    return (
      <>
        <p>
          For some reports, Pages Automated Site Reports already exclude certain findings
          which are irrelevant for statically hosted websites, based on unconfigurable
          server settings, or frequently produce ‘false positive’ findings for our customers.
          {' '}
          <b>
            While still visible in the report, the suppressed findings don’t count towards your
            total issue count.
          </b>
        </p>
        <p>
          You can specify additional results to be suppressed for this site by adding the
          related rules and any matching criteria to the exclusion list below.
          <ul>
            <li>
              <b>Specify comma-separated match criteria</b>
              {' '}
              to make sure you’re only suppressing results where the
              evidence contains that criteria you want to exclude.
            </li>
            <li>
              <b>Leave the criteria field empty</b>
              {' '}
              to suppress all results for that rule.
            </li>
          </ul>
        </p>
        <p>
          Remember to
          {' '}
          <b>be as specific as possible</b>
          {' '}
          when defining your match criteria.
        </p>
      </>
    );
  }

  function renderRulesets(sbts) {
    return sbts.map((sbt, i) => (
      <ExpandableArea
        bordered
        title={sbt.name}
        key={sbt.sbtId}
      >
        <div className="well">
          {helperText()}
          <table className="usa-table usa-table--borderless usa-table--stacked scan-config-table">
            <thead>
              <tr>
                <th scope="col">Rule to suppress</th>
                <th scope="col">Match criteria (leave empty for all)</th>
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {defaultScanRules.filter(rule => rule.type === sbt.id).map(ruleRender)}
              {customerRules.filter(rule => rule.type === sbt.id).map(ruleRender)}
            </tbody>
          </table>
          <button className="usa-button usa-button--outline" type="button" onClick={() => addNewRule(i)}>Add custom rule</button>
          <button
            className="usa-button"
            type="button"
            onClick={() => handleUpdate(sbt)}
            disabled={rulesSynced}
          >
            Save all rules
          </button>
          {!rulesSynced && (
            <span className="save-reminder">Make sure to save these changes.</span>
          )}
          <p className="post-scan-config-table-info">
            For more information on reports and rulesets, check out the
            {' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              title="Pages documentation on site reports"
              href="https://cloud.gov/pages/documentation/automated-site-reports/#configuration"
            >
              documentation
            </a>
            . If you’d like to suggest a rule to be suppressed for all sites,
            {' '}
            <a href="mailto:pages-support@cloud.gov" target="_blank" rel="noopener noreferrer" title="Email Pages Support at pages-support@cloud.gov">let us know</a>
            .
          </p>
        </div>
      </ExpandableArea>
    ));
  }

  return (
    <div className="grid-col-12">
      <h3 className="font-heading-xl margin-top-4 margin-bottom-2">Report Configurations</h3>
      {!defaultScanRules && (
        <div>
          <h4>
            An error occurred while loading your site report configurations.
          </h4>
        </div>
      )}
      {isLoading && (
        <div>
          <LoadingIndicator />
        </div>
      )}
      {!isLoading
        && defaultScanRules && (
          <>
            {renderRulesets(siteBuildTasks)}
          </>
      )}
    </div>
  );
}

ReportConfigs.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default ReportConfigs;
export { ReportConfigs };
