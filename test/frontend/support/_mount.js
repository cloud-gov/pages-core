import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import {
  createMemorySource,
  createHistory,
  LocationProvider,
  Router,
} from '@reach/router';

const mountRouter = (elem, url = '/', state = {}) => {
  const mockStore = configureStore([]);
  const source = createMemorySource(url);
  const history = createHistory(source);
  return mount(
    <LocationProvider history={history}>
      <Provider store={mockStore(state)}>
        <Router>
          {elem}
        </Router>
      </Provider>
    </LocationProvider>
  );
};

const mountStore = (elem, state = {}) => {
  const mockStore = configureStore([]);
  return mount(
    <Provider store={mockStore(state)}>
      <Router>
        {elem}
      </Router>
    </Provider>
  );
};

export { mountRouter, mountStore };
