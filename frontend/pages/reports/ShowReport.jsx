import React from 'react';
import { useParams } from 'react-router-dom';

import { useReportData } from '@hooks/useReportData';

import A11yScanIndex from './components/A11yScanIndexLayout';
import Zap from './components/Zap';
import ReportLoading from './components/Loading';
import ReportNotFound from './components/ReportNotFound';

export default function Report() {
  const { id } = useParams();
  const { data, isLoading } = useReportData(id);

  if (isLoading) return <ReportLoading />;
  if (!data) return <ReportNotFound />;

  const { report, siteId, buildId } = data;

  switch (data.type) {
    case 'owasp-zap':
      return <Zap data={report} siteId={siteId} buildId={buildId} />;
    case 'a11y':
      return <A11yScanIndex data={report} siteId={siteId} buildId={buildId} />;
    default:
      return <ReportNotFound />;
  }
}
