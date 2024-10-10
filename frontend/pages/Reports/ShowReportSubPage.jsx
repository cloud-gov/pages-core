import React from 'react';
import { useParams } from 'react-router-dom';

import { useReportData } from '@hooks/useReportData';

import A11yScanChild from './components/A11yScanChildLayout';
import ReportLoading from './components/Loading';
import ReportNotFound from './components/ReportNotFound';

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
