/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AlertBanner from './components/AlertBanner';
import ReportNotFound from './components/ReportNotFound';

export default function Report() {
  const { pathname } = useLocation();
  const onReportPage = pathname.startsWith('/report/');
  return (
    <>
      {onReportPage && <AlertBanner />}
      <a name="top" />
      <main className="grid-container">
        {onReportPage ? <Outlet /> : <ReportNotFound />}
      </main>
    </>
  );
}
