import React from 'react';
// import PropTypes from 'prop-types';

import LoadingIndicator from '@shared/LoadingIndicator';
const isLoading = false;

function FileStorageLogs() {
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="grid-col-12">
      <slot></slot>
    </div>
  );
}

export { FileStorageLogs };
export default FileStorageLogs;
