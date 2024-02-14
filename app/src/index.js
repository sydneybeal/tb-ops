import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { RoleProvider } from './components/RoleContext';
import Landing from './pages/Landing';
import AccommodationLogs from './pages/AccommodationLogs/AccommodationLogs';
import BedNightReports from './pages/BedNights/BedNightReports';
import Agencies from './pages/Agencies/Agencies';
import Consultants from './pages/Consultants/Consultants';
import Properties from './pages/Properties/Properties';
import TripReports from './pages/TripReports/TripReports';


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
    element: <Properties />,
  },
  {
    path: '/consultants/',
    element: <Consultants />,
  },
  {
    path: '/agencies/',
    element: <Agencies />,
  },
  {
    path: '/trip_reports/',
    element: <TripReports />,
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
