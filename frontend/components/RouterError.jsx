import React from 'react';
import { useRouteError } from 'react-router-dom';

// Create a temp error component
export default function RouterError() {
  const error = useRouteError();

  console.error(error);

  return (
    <main className="grid-container">
      <div className="usa-grid info-block usa-content">
        <h1>Error</h1>
        <p>
          Apologies! An error occurred in the application that we didn&apos;t
          know to handle. Refreshing the page might fix the problem but you can
          also notifiy us.
        </p>
      </div>
    </main>
  );
}
