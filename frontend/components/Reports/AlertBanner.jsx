import React from 'react';

export default function AlterBanner() {
  return (
    <section className="usa-alert usa-alert--warning usa-alert--slim usa-alert--no-icon">
      <div className="usa-alert__body">
        <p className="usa-alert__text">
          Please remember that
          {' '}
          <b>
            automated testing tools are limited 
          </b>
          {' '}
          and can only detect
          {' '}
          <i>some</i>
          {' '}
          issues.
        </p>
      </div>
    </section>
  );
}
