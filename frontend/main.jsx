import '@babel/polyfill';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { Provider } from 'react-redux';
import { createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

import routes from './routes';
import store from './store'

import './sass/styles.scss'

const mainEl = document.querySelector('#js-app');

const root = createRoot(mainEl);

const router = createBrowserRouter(
  createRoutesFromElements(routes)
);

root.render((
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
));
