
import React from 'react';
import { Link } from 'react-router-dom';

const BackToTopButton = () => (
  <div className="grid-row">
    <div className="grid-col">
      <span className="display-block back-to-top margin-bottom-2">
        <Link to="#top" className="usa-link">&uparrow; Back to top</Link>
      </span>
    </div>
  </div>
);

export default BackToTopButton;
