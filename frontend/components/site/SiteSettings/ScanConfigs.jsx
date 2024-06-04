import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import api from '../../../util/federalistApi';
import { BUILD_SCAN_RULES } from '../../../util/scanConfig';
import { useDefaultScanRules } from '../../../hooks/useDefaultScanRules';
import { useSiteBuildTasks } from '../../../hooks/useSiteBuildTasks';
import notificationActions from '../../../actions/notificationActions';
import ExpandableArea from '../../ExpandableArea';
import { IconTrash } from '../../icons';
import LoadingIndicator from '../../LoadingIndicator';

function getRuleName(rule) {
  return BUILD_SCAN_RULES.find(r => r.id === rule.id)?.name;
}
function ScanConfigs({ siteId: id }) {
  // TODO: maybe someday this needs to take siteBuildTask.branch into account

  const { siteBuildTasks } = useSiteBuildTasks(id);
  const [isLoading, setIsLoading] = useState(false);

  // we use default scan rules
  // and customer scan rules from siteBuildTasks
  const { defaultScanRules } = useDefaultScanRules();
  const [customerRules, setCustomerRules] = useState([]);

  useEffect(() => {
    setCustomerRules(
      siteBuildTasks.map(sbt => (sbt.metadata?.rules ? sbt.metadata.rules : [])).flat()
    );
  }, [siteBuildTasks]);

  function handleUpdate() {
    Promise.all(siteBuildTasks.map((siteBuildTask) => {
      const typeRules = customerRules.filter(rule => rule.type === siteBuildTask.id);
      return api.updateSiteBuildTask(id, siteBuildTask.sbtId, { rules: typeRules });
    }))
      .then(() => notificationActions.success('Successfully saved scan configuration.'))
      .catch(() => notificationActions.success('Error saving scan configuration.'))
      .finally(() => setIsLoading(false));
  }

  function addNewRule(index) {
    // start with pseudo-random ids to avoid key collisions
    // default to the first type
    const newRule = { id: Math.random().toString(36).slice(2), type: siteBuildTasks[index].id };
    setCustomerRules(customerRules.concat([newRule]));
  }

  function updateRule(event, ruleId, prop) {
    const { value } = event.target;
    const newRules = customerRules.slice(0);
    const rule = newRules.find(r => r.id === ruleId);
    rule[prop] = value;
    setCustomerRules(newRules);
  }

  function deleteRule(rule) {
    const newRules = customerRules.filter(r => r.id !== rule.id);
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
        id={`${name}-select`}
        value={rule[prop]}
        onChange={event => updateRule(event, rule.id, prop)}
        disabled={rule.source === 'Pages'}
      >
        {options
          .map(o => (
            <option
              key={o.id}
              value={o.id}
            >
              {o.name}
              {' '}
              (#
              {o.id}
              )
            </option>
          ))}
      </select>
    );
  }

  function ruleRender(rule) {
    return (
      (
        <tr key={rule.id}>
          <td>
            {rule.source !== 'Pages' ? (
              selectRender(rule, availableRules(rule), 'id', 'rules')
            ) : (
              <p>
                <b>{getRuleName(rule)}</b>
                {' '}
                (#
                {rule.id}
                )
                <br />
                Common false positive suppressed by Pages
              </p>
            )}
          </td>
          <td>
            { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
            <label className="usa-sr-only" htmlFor={`${rule.id}-criteria`}>Criteria to match:</label>
            <input id={`${rule.id}-criteria`} type="text" placeholder={rule.source !== 'Pages' ? '/assets, class="ignore"' : 'not editable'} disabled={rule.source === 'Pages'} onChange={event => updateRule(event, rule.id, 'match')} value={rule.match} />
          </td>
          <td>
            { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
            <label className="usa-sr-only" htmlFor={`${rule.id}-delete`}>Delete this rule</label>
            <button id={`${rule.id}-delete`} className="button-delete" disabled={rule.source === 'Pages'} aria-label={rule.source === 'Pages' ? 'Cannot delete this rule' : 'Delete this rule'} type="button" onClick={() => deleteRule(rule)}>
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
          {sbt.name}
          {' '}
          reports produced by cloud.gov Pages will automatically suppress certain scan findings
          which are irrelevant for statically hosted websites or frequently produce ‘false
          positive’ findings for our customers. You can specify additional findings to be
          suppressed for this site by adding the rule and any matching criteria to the ignore
          list below.
          {' '}
          <b>
            While still visible in the report, the suppressed findings don’t count towards your
            total issue count.
          </b>
        </p>
        <p>
          Matching criteria will limit the suppression of findings to any partial string match in:
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
          when defining your matching criteria.
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
                <th scope="col">Choose a rule from this scan to suppress in reports</th>
                <th scope="col">Matching criteria (leave empty for all)</th>
                <th scope="col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {defaultScanRules.filter(rule => rule.type === sbt.id).map(ruleRender)}
              {customerRules.filter(rule => rule.type === sbt.id).map(ruleRender)}
            </tbody>
          </table>
          <button className="usa-button usa-button-secondary" type="button" onClick={() => addNewRule(i)}>Add custom rule</button>
          <button className="usa-button" type="button" onClick={handleUpdate}>Save all rules</button>
          <p className="post-scan-config-table-info">
            For more information on scans and rulesets, check out the
            {' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              title="Pages documentation on site scans"
              href="https://cloud.gov/pages/documentation/build-scans/"
            >
              documentation
            </a>
            . If you’d like to suggest a rule to be suppressed due to false positives,
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
      <h3>Scan Configurations</h3>
      {!defaultScanRules && (
        <div>
          <h4>
            An error occurred while loading your site scan configurations.
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

ScanConfigs.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default ScanConfigs;
