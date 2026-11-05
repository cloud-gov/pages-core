import React from 'react';
import PropTypes from 'prop-types';
import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Array} [props.data]
 * @param {string} [props.dataHeader]
 * @param {string} [props.dataMessage]
 * @param {{ message: string }} [props.error]
 * @param {string} [props.errorMessage]
 * @param {boolean} props.isPending
 * @param {boolean} props.isPlaceholderData
 * @param {boolean} [props.showErrorIfEmpty]
 */
export default function QueryPage({
  children,
  data,
  dataHeader,
  dataMessage,
  error,
  errorMessage,
  isPending,
  isPlaceholderData,
  showErrorIfEmpty = true,
}) {
  if (error) {
    const message = errorMessage || error.message;
    return <AlertBanner status="error" header={'Error'} message={message} />;
  }

  if (isPending) {
    return <LoadingIndicator />;
  }

  if (showErrorIfEmpty && !isPlaceholderData && data?.length === 0) {
    const header = dataHeader || 'No data available.';
    const message = dataMessage || 'There is no data currently available for this page.';
    return <AlertBanner status="info" header={header} message={message} />;
  }

  if (!isPlaceholderData) {
    return children;
  }

  return null;
}

QueryPage.propTypes = {
  children: PropTypes.node.isRequired,
  data: PropTypes.array,
  dataHeader: PropTypes.string,
  dataMessage: PropTypes.string,
  error: PropTypes.shape({ message: PropTypes.string }),
  errorMessage: PropTypes.string,
  isPending: PropTypes.bool.isRequired,
  isPlaceholderData: PropTypes.bool.isRequired,
  showErrorIfEmpty: PropTypes.bool,
};
