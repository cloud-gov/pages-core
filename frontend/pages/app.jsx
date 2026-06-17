import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import alertActions from '@actions/alertActions';

function shouldClearAlert(alert) {
  if (alert.stale) {
    alertActions.clear();
    return;
  }

  if (alert.message) {
    alertActions.update(alert.stale);
  }
}
export function App({ onEnter }) {
  const location = useLocation();
  const queryClient = new QueryClient();
  const alert = useSelector((state) => state.alert);
  const notifications = useSelector((state) => state.notifications);

  useEffect(() => {
    onEnter();
  }, []);

  useEffect(() => {
    if (alert.message) {
      shouldClearAlert(alert);
    }
  }, [location.key]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid-container">
        <Notifications notifications={notifications} />
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}

App.propTypes = {
  onEnter: PropTypes.func.isRequired,
};

export default App;
