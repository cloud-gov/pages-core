import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mountRouter = (elem, path = '/', url = '/', state = {}) => {
  const mockStore = configureStore([]);
  return mount(
    <Provider store={mockStore(state)}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={elem} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

const mountStore = (elem, state = {}) => {
  const mockStore = configureStore([]);
  return mount(<Provider store={mockStore(state)}>{elem}</Provider>);
};

export { mountRouter, mountStore };
