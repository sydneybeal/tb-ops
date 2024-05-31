import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
// import { RoleProvider } from './components/RoleContext';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AccommodationLogs from './pages/AccommodationLogs/AccommodationLogs';
import AccommodationLogDetails from './pages/AccommodationLogs/Details';
import BedNightReports from './pages/BedNights/BedNightReports';
import LookerReports from './pages/BedNights/LookerReports';
import Agencies from './pages/Agencies/Agencies';
import BookingChannels from './pages/BookingChannels/BookingChannels';
import Portfolios from './pages/Portfolios/Portfolios';
import Consultants from './pages/Consultants/Consultants';
import Properties from './pages/Properties/Properties';
import PropertyDetails from './pages/PropertyDetails/PropertyDetails';
import Countries from './pages/Countries/Countries';
import Maps from './pages/Maps/Maps';
// import Overlaps from './pages/Overlaps/Overlaps';
import OverlapsV2 from './pages/Overlaps/OverlapsV2';
import TripReports from './pages/TripReports/TripReports';
import AddEditTripReport from './pages/TripReports/AddEditTripReport';
import AuditLanding from './pages/AuditLogs/AuditLanding';
import TripLanding from './pages/Trips/TripLanding';
import FaqPage from './pages/FAQ/FAQ';


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
    path: '/service_providers/:log_id',
    element: (
      <ProtectedRoute>
        <AccommodationLogDetails />
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
    path: '/faq/',
    element: (
      <ProtectedRoute>
        <FaqPage />
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
    path: '/property_details/',
    element: (
      <ProtectedRoute>
        <PropertyDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/looker_reports/',
    element: (
      <ProtectedRoute>
        <LookerReports />
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
    path: '/countries/',
    element: (
      <ProtectedRoute>
        <Countries />
      </ProtectedRoute>
    ),
  },
  {
    path: '/overlaps/',
    element: (
      <ProtectedRoute>
        <OverlapsV2 />
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
    path: '/trip_reports/new',
    element: (
      <ProtectedRoute>
        <AddEditTripReport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trip_reports/edit/:trip_report_id',
    element: (
      <ProtectedRoute>
        <AddEditTripReport />
      </ProtectedRoute>
    ),
  },
  {
    path: '/audit_logs/',
    element: (
      <ProtectedRoute>
        <AuditLanding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trips/',
    element: (
      <ProtectedRoute>
        <TripLanding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/maps/',
    element: (
      <ProtectedRoute>
        <Maps />
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
