import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { RoleProvider } from './components/RoleContext';
import Landing from './pages/Landing';
import AccommodationLogs from './pages/AccommodationLogs/AccommodationLogs';
import BedNightReports from './pages/BedNights/BedNightReports';

import 'materialize-css/dist/css/materialize.min.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AccommodationLogs />,
  },
  {
    path: '/service_providers/',
    element: <AccommodationLogs />,
  },
  {
    path: '/bed_night_reports/',
    element: <BedNightReports />,
  },
  {
    path: '/properties/',
    element: <Landing />,
  },
  {
    path: '/consultants/',
    element: <Landing />,
  },
  {
    path: '/agencies/',
    element: <Landing />,
  },
  {
    path: '/trip_reports/',
    element: <Landing />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<RouterProvider router={router} />);
// const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RoleProvider>
    <RouterProvider router={router} />
  </RoleProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
