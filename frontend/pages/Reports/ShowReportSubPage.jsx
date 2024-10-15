import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import A11yScanChild from '../../components/Reports/A11yScanChildLayout';
import ReportLoading from '../../components/Reports/Loading';
import ReportNotFound from '../../components/Reports/ReportNotFound';
import { useReportData } from '../../hooks/useReportData';
import { useDefaultScanRules } from '../../hooks/useDefaultScanRules';

export default function Report() {
  const { id, subpage } = useParams();
  const { data, isLoading } = useReportData(id, subpage);

  if (isLoading) return <ReportLoading />;
  if (!data) return <ReportNotFound />;

  const { report, siteId, buildId } = data;

  // customer's rules that were active when this report ran
  const { rules: reportScanRules } = data.SiteBuildTask.metadata;

  // default rules for everyone
  const { defaultScanRules } = useDefaultScanRules();

  if (data.type === 'a11y') {
    return (
      <A11yScanChild
        report={report}
        defaultRules={defaultScanRules}
        reportRules={reportScanRules}
        siteId={siteId}
        buildId={buildId}
      />
    );
  }

  return <ReportNotFound />;
}
