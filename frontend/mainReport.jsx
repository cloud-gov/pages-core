import '@babel/polyfill';
import { createRoot } from 'react-dom/client';
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';

import routes from './reportRoutes';

const mainEl = document.querySelector('#report-app');
const root = createRoot(mainEl);

const router = createBrowserRouter(createRoutesFromElements(routes));

root.render(<RouterProvider router={router} />);
