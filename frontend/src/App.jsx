import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import MapView from './pages/MapView';
import Login from './pages/Login';
import NetworkResilience from './pages/NetworkResilience';
import Resources from './pages/Resources';
import Allocations from './pages/Allocations';
import SyncCenter from './pages/SyncCenter';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        
        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/map" element={<MapView />} />
          
          <Route path="/network-resilience" element={<NetworkResilience />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/allocations" element={<Allocations />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sync" element={<SyncCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
