import React from 'react';

export default function TypeNotFound() {
  return (
    <div className="usa-prose padding-y-10">
      <h1>Report type not found</h1>
      <p className="usa-intro">
        We are sorry, we cannot find the report type you are looking for. This may
        be an error, it changed location, or made is no longer unavailable.
      </p>
      <p>
        If you typed the URL directly, check your spelling and capitalization.
        Our URLs look like this:
      </p>
      <p>
        Visit our homepage for helpful tools and resources, or contact us and
        we will point you in the right direction.
      </p>
      <div className="margin-y-5">
        <ul className="usa-button-group">
          <li className="usa-button-group__item">
            <a href="/" className="usa-button">
              Return to homepage
            </a>
          </li>
          <li className="usa-button-group__item">
            <button className="usa-button usa-button--outline" type="button">
              Contact Us
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
