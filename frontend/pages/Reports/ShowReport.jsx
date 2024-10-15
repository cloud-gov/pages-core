import React from 'react';
import { useParams } from 'react-router-dom';

import A11yScanIndex from '../../components/Reports/A11yScanIndexLayout';
import Zap from '../../components/Reports/Zap';
import ReportLoading from '../../components/Reports/Loading';
import ReportNotFound from '../../components/Reports/ReportNotFound';
import { useReportData } from '../../hooks/useReportData';
import { useDefaultScanRules } from '../../hooks/useDefaultScanRules';

export default function Report() {
  const { id } = useParams();
  const { data, isLoading } = useReportData(id);

  // default rules for everyone, every task
  const { defaultScanRules } = useDefaultScanRules();

  if (isLoading) return <ReportLoading />;
  if (!data) return <ReportNotFound />;

  const { report, siteId, buildId } = data;
  // customer's rules that were active when this report ran
  const sbtCustomRules = data.SiteBuildTask?.metadata?.rules || [];
  const sbtId = data.SiteBuildTask?.id || null;

  switch (data.type) {
    case 'owasp-zap':
    case 'zap':
      return (
        <Zap
          siteId={siteId}
          buildId={buildId}
          sbtId={sbtId}
          sbtType={data.type}
          report={report}
          defaultRules={defaultScanRules.filter(rule => rule.type === data.type)}
          sbtCustomRules={sbtCustomRules}
        />
      );
    case 'a11y':
      return (
        <A11yScanIndex
          siteId={siteId}
          buildId={buildId}
          report={report}
          sbtType={data.type}
        />
      );
    default:
      return <ReportNotFound />;
  }
}
