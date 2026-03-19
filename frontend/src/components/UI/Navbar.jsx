/**
 * Navbar Component
 * Main navigation with logo and tabs
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Fuel, MapPin, List, Navigation } from 'lucide-react';
import { useLocation as useUserLocation } from '@/context/LocationContext';

const Navbar = () => {
  const location = useLocation();
  const { location: userLocation, permissionStatus } = useUserLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center group-hover:bg-amber-400 transition-colors">
              <Fuel className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-xl font-bold text-white">
              Fuel<span className="text-amber-500">Now</span>
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <MapPin className="w-5 h-5" />
              Nearby
            </NavLink>
            <NavLink
              to="/stations"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <List className="w-5 h-5" />
              All Stations
            </NavLink>
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              {permissionStatus === 'granted' && userLocation ? (
                <span className="flex items-center gap-1 text-green-400">
                  <Navigation className="w-4 h-4" />
                  <span className="text-slate-400">Location active</span>
                </span>
              ) : permissionStatus === 'denied' ? (
                <span className="flex items-center gap-1 text-red-400">
                  <Navigation className="w-4 h-4" />
                  <span className="text-slate-400">Location denied</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-500">
                  <Navigation className="w-4 h-4" />
                  <span>Locating...</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-800">
        <div className="flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <MapPin className="w-5 h-5" />
            Nearby
          </NavLink>
          <NavLink
            to="/stations"
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <List className="w-5 h-5" />
            All Stations
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
