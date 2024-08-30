import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import api from '../../../util/federalistApi';
import { BUILD_SCAN_RULES } from '../../../util/scanConfig';
import { useDefaultScanRules } from '../../../hooks/useDefaultScanRules';
import { useSiteBuildTasks } from '../../../hooks/useSiteBuildTasks';
import notificationActions from '../../../actions/notificationActions';
import ExpandableArea from '../../ExpandableArea';
import { IconTrash, IconExternalLink } from '../../icons';
import LoadingIndicator from '../../LoadingIndicator';

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
    const placeholder = (rule.match?.join(', ') || '') + (isPagesRule ? ' (not editable - suppressed by Pages)' : '/assets class="ignore"');
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
          <td>
            { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
            <label className="usa-sr-only" htmlFor={`${rule.id}-criteria`}>Criteria to match:</label>
            <input
              id={`${rule.id}-criteria`}
              type="text"
              placeholder={placeholder}
              disabled={isPagesRule}
              onChange={event => updateRule(event, rule.id, 'match')}
              value={isPagesRule ? '' : rule.match?.join(', ')}
            />
          </td>
          <td>
            { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
            <label className="usa-sr-only" htmlFor={`${rule.id}-delete`}>Delete this rule</label>
            <button id={`${rule.id}-delete`} className="button-delete" disabled={isPagesRule} aria-label={isPagesRule ? 'Cannot delete this rule' : 'Delete this rule'} type="button" onClick={() => deleteRule(rule)}>
              <IconTrash className="icon-delete" aria-hidden />
            </button>
          </td>
        </tr>
      )
    );
  }
  function helperText(sbt) {
    return (
      <>
        <p>
          The
          {' '}
          {sbt.name}
          {' '}
          produced by cloud.gov Pages will automatically suppress certain findings
          which are irrelevant for statically hosted websites, based on unconfigurable
          server settings, or frequently produce ‘false positive’ findings for our customers.
          You can specify additional findings to be suppressed for this site by adding the rule
          and any matching criteria to the ignore list below.
          {' '}
          <b>
            While still visible in the report, the suppressed findings don’t count towards your
            total issue count.
          </b>
        </p>
        <p>
          Specifying match criteria will limit the suppression of findings to any partial string
          match in:
        </p>
        <ul>
          <li>
            the HTML of the finding (such as an
            {' '}
            <code>id</code>
            )
          </li>
          <li>the URL of the page where the finding is discovered</li>
          <li>the URL of a specific resource to be ignored</li>
        </ul>
        <p>
          Try to
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
          {helperText(sbt)}
          <table className="usa-table usa-table-borderless scan-config-table">
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
          <button className="usa-button usa-button-secondary" type="button" onClick={() => addNewRule(i)}>Add custom rule</button>
          <button
            className="usa-button"
            type="button"
            onClick={() => handleUpdate(sbt)}
            disabled={rulesSynced}
          >
            Save all rules
          </button>
          <p className="post-scan-config-table-info">
            For more information on reports and rulesets, check out the
            {' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              title="Pages documentation on site reports"
              href="https://cloud.gov/pages/documentation/build-scans/"
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
    <div>
      <h3>Report Configurations</h3>
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
