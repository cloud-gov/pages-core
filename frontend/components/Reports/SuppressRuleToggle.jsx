import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

import { BUILD_SCAN_RULES } from '../../util/scanConfig';
import { useDefaultScanRules } from '../../hooks/useDefaultScanRules';
import { useSiteBuildTasks } from '../../hooks/useSiteBuildTasks';

import { useReportData } from '../../hooks/useReportData';

function SuppressRuleToggle({ ruleId = ''}) {
  // get report ID
  const { id } = useParams();
  const { data } = useReportData(id);
  const { siteBuildTasks, isLoading } = useSiteBuildTasks(data?.siteId || 0);

  // get SBT id
  const sbtType = data?.type;
  if (isLoading) return null;

  return (
    <>
      <br />
      <br />
      RuleId:
      {ruleId}
      <br />
      sbtType:
      {sbtType}
      <br />
      siteBuildTasks:
      {siteBuildTasks}
    </>
  );
}

SuppressRuleToggle.propTypes = {
  ruleId: PropTypes.string.isRequired,
};

export default SuppressRuleToggle;
export { SuppressRuleToggle };
