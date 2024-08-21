import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="usa-grid info-block usa-content">
    <h1>404 / Page not found</h1>
    <p>
      You might want to double-check your link and try again, or return to
      {' '}
      <Link to="/sites">your Pages Sites</Link>
      .
    </p>
  </div>
);

export default NotFound;
