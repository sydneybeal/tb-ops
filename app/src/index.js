import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
// import { RoleProvider } from './components/RoleContext';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AccommodationLogs from './pages/AccommodationLogs/AccommodationLogs';
import BedNightReports from './pages/BedNights/BedNightReports';
import Agencies from './pages/Agencies/Agencies';
import BookingChannels from './pages/BookingChannels/BookingChannels';
import Portfolios from './pages/Portfolios/Portfolios';
import Consultants from './pages/Consultants/Consultants';
import Properties from './pages/Properties/Properties';
import TripReports from './pages/TripReports/TripReports';
import AuditLogs from './pages/AuditLogs/AuditLogs';


import 'materialize-css/dist/css/materialize.min.css';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AccommodationLogs />
      </ProtectedRoute>
    ),
  },
  {
    path: '/service_providers/',
    element: (
      <ProtectedRoute>
        <AccommodationLogs />
      </ProtectedRoute>
    ),
  },
  {
    path: '/bed_night_reports/',
    element: (
      <ProtectedRoute>
        <BedNightReports />
      </ProtectedRoute>
    ),
  },
  {
    path: '/properties/',
    element: (
      <ProtectedRoute>
        <Properties />
      </ProtectedRoute>
    ),
  },
  {
    path: '/consultants/',
    element: (
      <ProtectedRoute>
        <Consultants />
      </ProtectedRoute>
    ),
  },
  {
    path: '/agencies/',
    element: (
      <ProtectedRoute>
        <Agencies />
      </ProtectedRoute>
    ),
  },
  {
    path: '/booking_channels/',
    element: (
      <ProtectedRoute>
        <BookingChannels />
      </ProtectedRoute>
    ),
  },
  {
    path: '/portfolios/',
    element: (
      <ProtectedRoute>
        <Portfolios />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trip_reports/',
    element: (
      <ProtectedRoute>
        <TripReports />
      </ProtectedRoute>
    ),
  },
  {
    path: '/audit_logs/',
    element: (
      <ProtectedRoute>
        <AuditLogs />
      </ProtectedRoute>
    ),
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<RouterProvider router={router} />);
// const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
