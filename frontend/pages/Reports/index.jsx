import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AlertBanner from '../../components/Reports/AlertBanner';
import TypeNotFound from '../../components/Reports/ReportNotFound';

export default function Report() {
  const { pathname } = useLocation();
  const onReportPage = pathname.startsWith('/report');

  return (
    <>
      {!onReportPage && <AlertBanner />}
      { /* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */ }
      <a name="top" />
      <main className="grid-container">
        {onReportPage ? <TypeNotFound /> : <Outlet />}
      </main>
    </>
  );
}
