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
      <a name="top"></a>
      <main className="grid-container">
        {onReportIndex ? <TypeNotFound /> : <Outlet/>}
      </main>
    </>
  );
}
