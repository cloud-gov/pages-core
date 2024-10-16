import React from 'react';
import { useParams } from 'react-router-dom';

import A11yScanChild from '../../components/Reports/A11yScanChildLayout';
import ReportLoading from '../../components/Reports/Loading';
import ReportNotFound from '../../components/Reports/ReportNotFound';
import { useReportData } from '../../hooks/useReportData';

export default function Report() {
  const { id, subpage } = useParams();
  const { data, isLoading } = useReportData(id, subpage);

  if (isLoading) return <ReportLoading />;
  if (!data) return <ReportNotFound />;

  const { report, siteId, buildId } = data;
  const sbtCustomRules = data.SiteBuildTask?.metadata?.rules || [];
  const sbtId = data.SiteBuildTask?.id || null;

  if (data.type === 'a11y' && report) {
    return (
      <A11yScanChild
        siteId={siteId}
        buildId={buildId}
        sbtId={sbtId}
        sbtType={data.type}
        report={report}
        sbtCustomRules={sbtCustomRules}
      />
    );
  }

  return <ReportNotFound />;
}
