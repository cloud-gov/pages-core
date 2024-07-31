import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AlertBanner from '../../components/Reports/AlertBanner';
import TypeNotFound from './TypeNotFound';
// TODO: figure out how to add some custom styles to just this part of the app
// webpack no likey because styles.css is already taken
// import styles from "./reports.module.scss";
export default function Report() {
  const { pathname } = useLocation();
  const onReportIndex = pathname === '/report' || pathname === '/report/';

  return (
    <main id="top" className="grid-container">
      <AlertBanner />
      <div>
        {onReportIndex ? <TypeNotFound /> : <Outlet/>}
      </div>
    </main>
  );
}
