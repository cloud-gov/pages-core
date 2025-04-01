import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import AlertBanner from '@shared/alertBanner';
import LoadingIndicator from '@shared/LoadingIndicator';

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
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  dataHeader: PropTypes.string,
  dataMessage: PropTypes.string,
  error: PropTypes.shape({ message: PropTypes.string }),
  errorMessage: PropTypes.string,
  isPending: PropTypes.bool.isRequired,
  isPlaceholderData: PropTypes.bool.isRequired,
  showErrorIfEmpty: PropTypes.bool,
};
