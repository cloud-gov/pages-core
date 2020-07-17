import React from 'react';
import { Link } from '@reach/router';

const NotFound = () => (
  <div className="usa-grid">
    <h1>Nothing to see here!</h1>
    <Link to="/sites">Head Back</Link>
  </div>
);

export default NotFound;
