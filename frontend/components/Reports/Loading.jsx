import React from 'react';
import PropTypes from 'prop-types';

export default function ReportLoading({ text = 'Please wait...' }) {
  return (
    <div className="usa-prose padding-y-10">
      <h1>Report loading</h1>
      <p className="usa-intro">{text}</p>
      <div className="loader loader--main">
        <div className="uil-ring-css">
          <div />
        </div>
      </div>
    </div>
  );
}

ReportLoading.propTypes = {
  text: PropTypes.string,
};
