import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AlertBanner from '../../components/Reports/AlertBanner';
import TypeNotFound from './TypeNotFound';

export default function Report() {
  const { pathname } = useLocation();
  const onReportIndex = pathname === '/report' || pathname === '/report/';

  // TODO: A not found for missing reports, not just report types
  return (
    <>
      {!onReportIndex && <AlertBanner />}
      { /* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */ }
      <a name="top" />
      <main className="grid-container">
        {onReportIndex ? <TypeNotFound /> : <Outlet />}
      </main>
    </>
  );
}
