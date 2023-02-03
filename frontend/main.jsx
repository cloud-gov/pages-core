/* global document:true */

import '@babel/polyfill';
import { render } from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

import routes from './routes';
import store from './store';

import './sass/styles.scss';

const mainEl = document.querySelector('#js-app');

const router = createBrowserRouter(
  createRoutesFromElements(routes)
);

render((
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
), mainEl);
