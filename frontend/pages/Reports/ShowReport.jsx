import React from 'react';
import { useParams } from 'react-router-dom';

import A11yScanIndex from '../../components/Reports/A11yScanIndexLayout';
import Zap from '../../components/Reports/Zap';
import ReportLoading from '../../components/Reports/Loading';
import ReportNotFound from '../../components/Reports/ReportNotFound';
import { useReportData } from '../../hooks/useReportData';

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
