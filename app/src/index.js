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
import Clients from './pages/Clients/Clients';
import Referrals from './pages/Clients/Referrals';
import MatchReferrals from './pages/Clients/MatchReferrals';
import EntryElements from './pages/EntryElements/EntryElements';
import PropertiesView from './pages/Properties/PropertiesView';
import LookerReports from './pages/BedNights/LookerReports';
import Maps from './pages/Maps/Maps';
import PropertyDetails from './pages/PropertyDetails/PropertyDetails';
import Wrapped from './pages/Wrapped/Wrapped';
// import Overlaps from './pages/Overlaps/Overlaps';
import OverlapsV2 from './pages/Overlaps/OverlapsV2';
import TripReports from './pages/TripReports/TripReports';
import AuditLanding from './pages/AuditLogs/AuditLanding';
import TripLanding from './pages/Trips/TripLanding';
import TripsOverview from './pages/Trips/TripsOverview';
import TripDetail from './pages/Trips/TripDetail';
import TripEdit from './pages/Trips/TripEdit';
import DailyRates from './pages/DailyRates/DailyRates';
import AddRates from './pages/DailyRates/AddRates';
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
    path: '/entry_elements/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <EntryElements />
      </ProtectedRoute>
    ),
  },
  {
    path: '/property_details/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PropertyDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/looker_reports/',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'leadership']}>
        <LookerReports />
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
    path: '/wrapped/',
    element: (
      <ProtectedRoute>
        <Wrapped />
      </ProtectedRoute>
    ),
  },
  {
    path: '/properties/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <PropertiesView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trip_reports/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <TripReports />
      </ProtectedRoute>
    ),
  },
  {
    path: '/audit_logs/',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AuditLanding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trips/',
    element: (
      <ProtectedRoute>
        <TripsOverview />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trip_matching/',
    element: (
      <ProtectedRoute allowedRoles={['admin']} allowedUsers={['amandab@travelbeyond.com','samanthae@travelbeyond.com']}>
        <TripLanding />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trip/:trip_id',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <TripDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/trip/edit/:trip_id',
    element: (
      <ProtectedRoute>
        <TripEdit />
      </ProtectedRoute>
    ),
  },
  {
    path: '/daily_rates/',
    element: (
      <ProtectedRoute>
        <DailyRates />
      </ProtectedRoute>
    ),
  },
  {
    path: '/daily_rates/add',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'accounting']}>
        <AddRates />
      </ProtectedRoute>
    ),
  },
  {
    path: '/overview/',
    element: (
      <ProtectedRoute>
        <Maps />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clients/',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'leadership']}>
        <Clients />
      </ProtectedRoute>
    ),
  },
  {
    path: '/referrals/',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'leadership']}>
        <Referrals />
      </ProtectedRoute>
    ),
  },
  {
    path: '/match_referrals/',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'leadership']}>
        <MatchReferrals />
      </ProtectedRoute>
    )
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
