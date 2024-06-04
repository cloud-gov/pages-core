import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import api from '../../../util/federalistApi';
import { BUILD_SCAN_RULES } from '../../../util/scanConfig';
import { useDefaultScanRules } from '../../../hooks/useDefaultScanRules';
import { useSiteBuildTasks } from '../../../hooks/useSiteBuildTasks';
import notificationActions from '../../../actions/notificationActions';

function getInfo(rule) {
  return BUILD_SCAN_RULES.find(r => r.id === rule.id)?.url;
}

function ScanConfig() {
  // TODO: maybe someday this needs to take siteBuildTask.branch into account
  const { id } = useParams();

  const { siteBuildTasks } = useSiteBuildTasks(id);

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
      .catch(() => notificationActions.success('Error saving scan configuration.'));
  }

  function addNewRule() {
    // start with pseudo-random ids to avoid key collisions
    // default to the first type
    const newRule = { id: Math.random().toString(36).slice(2), type: siteBuildTasks[0].id };
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
      .filter(rule => rule.type === checkRule.type)
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
            </option>
          ))}
      </select>
    );
  }

  function ruleRender(rule) {
    return (
      (
        <li key={rule.id}>
          {selectRender(rule, siteBuildTasks, 'type', 'ruleset')}
          {selectRender(rule, availableRules(rule), 'id', 'rules')}
          <input type="text" placeholder={rule.source !== 'Pages' ? '/assets, class="ignore"' : undefined} onChange={event => updateRule(event, rule.id, 'match')} value={rule.match} />
          {rule.source !== 'Pages' && (
            <a href={getInfo(rule)}>more info</a>
          )}
          {rule.source !== 'Pages' && (
            <button type="button" onClick={() => deleteRule(rule)}>Trash Can</button>
          )}
        </li>
      )
    );
  }

  return (
    <div>
      <p>
        Scan config for
        {id}
      </p>
      Default Rules
      {defaultScanRules.map(ruleRender)}
      Rules
      <ul>
        {customerRules.map(ruleRender)}
      </ul>
      <button type="button" onClick={addNewRule}>Add</button>
      <button type="button" onClick={handleUpdate}>Save</button>
    </div>
  );
}

export { ScanConfig };
export default ScanConfig;
