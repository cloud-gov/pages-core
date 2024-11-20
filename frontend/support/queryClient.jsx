import React from 'react';
import PropTypes from 'prop-types';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

export const createWrapper = (config = {}) => {
  const queryClient = new QueryClient(config);

  function QueryClientWrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  QueryClientWrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return {
    queryClient,
    QueryClientWrapper,
  };
};

export const createTestQueryClient = () => {
  return () => {
    const { QueryClientWrapper } = createWrapper({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return QueryClientWrapper;
  };
};
