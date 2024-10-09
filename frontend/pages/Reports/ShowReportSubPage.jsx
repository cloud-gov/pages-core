import React from 'react';
import { useParams } from 'react-router-dom';

import A11yScanChild from '@shared/Reports/A11yScanChildLayout';
import ReportLoading from '@shared/Reports/Loading';
import ReportNotFound from '@shared/Reports/ReportNotFound';
import { useReportData } from '@hooks/useReportData';

export default function Report() {
  const { id, subpage } = useParams();
  const { data, isLoading } = useReportData(id, subpage);

  if (isLoading) return <ReportLoading />;
  if (!data) return <ReportNotFound />;

  const { report, siteId, buildId } = data;

  if (data.type === 'a11y') {
    return <A11yScanChild data={report} siteId={siteId} buildId={buildId} />;
  }

  return <ReportNotFound />;
}
