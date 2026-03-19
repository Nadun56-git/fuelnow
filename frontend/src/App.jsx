/**
 * FuelNow - Main App Component
 * Root component with routing and providers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StationProvider } from '@/context/StationContext';
import { LocationProvider } from '@/context/LocationContext';
import { ToastProvider } from '@/components/UI/Toast';
import Navbar from '@/components/UI/Navbar';
import Home from '@/pages/Home';
import AllStations from '@/pages/AllStations';
import StationPage from '@/pages/StationPage';
import LocationNotifier from '@/components/UI/LocationNotifier';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <LocationProvider>
        <StationProvider>
          <Router>
            <LocationNotifier />
            <div className="min-h-screen bg-slate-900">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/stations" element={<AllStations />} />
                <Route path="/station/:id" element={<StationPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </StationProvider>
      </LocationProvider>
    </ToastProvider>
  );
}

// 404 Not Found component
const NotFound = () => (
  <div className="min-h-[calc(100vh-64px)] bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-amber-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
      <p className="text-slate-400 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
);

export default App;
