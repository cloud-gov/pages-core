import React from 'react';
import { Link } from 'react-router-dom';

const BackToIndexButton = () => (
  <div className="grid-row">
    <div className="grid-col">
      <span className="display-block margin-bottom-2">
        <Link to="./../" className="usa-link">&#8676; Back to report index</Link>
      </span>
    </div>
  </div>
);

export default BackToIndexButton;
