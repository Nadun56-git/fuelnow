/**
 * StationDetail Component
 * Full station detail view with update button
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Clock, ArrowLeft, Edit3, Fuel, Calendar } from 'lucide-react';
import { FuelBadge, StationStatusBadge } from './FuelBadge';
import { formatDistance, formatTimeAgo } from '@/utils/distance';

const StationDetail = ({ 
  station, 
  onUpdateClick,
  className = ''
}) => {
  const navigate = useNavigate();

  if (!station) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">No station selected</p>
      </div>
    );
  }

  // Get most recent update time
  const getLastUpdated = () => {
    if (!station.fuel) return null;
    const times = Object.values(station.fuel)
      .map(f => f?.lastUpdated)
      .filter(Boolean);
    return times.length > 0 ? new Date(Math.max(...times.map(t => new Date(t)))) : null;
  };

  const lastUpdated = getLastUpdated();

  // Fuel type configurations
  const fuelTypes = [
    { key: 'superDiesel', label: 'Super Diesel', color: 'text-purple-400' },
    { key: 'diesel', label: 'Diesel', color: 'text-blue-400' },
    { key: 'superPetrol', label: 'Super Petrol', color: 'text-amber-400' },
    { key: 'petrol', label: 'Petrol', color: 'text-green-400' }
  ];

  return (
    <div className={`bg-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1">{station.name}</h1>
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{station.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Status & Distance */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <StationStatusBadge fuel={station.fuel} />
          
          {station.distance !== undefined && (
            <div className="flex items-center gap-1 text-amber-500">
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-medium">{formatDistance(station.distance)}</span>
            </div>
          )}
          
          {lastUpdated && (
            <div className="flex items-center gap-1 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Updated {formatTimeAgo(lastUpdated)}</span>
            </div>
          )}
        </div>

        {/* Fuel Availability */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-500" />
            Fuel Availability
          </h2>
          
          <div className="grid gap-3">
            {fuelTypes.map(({ key, label, color }) => {
              const fuelData = station.fuel?.[key];
              return (
                <div 
                  key={key}
                  className="bg-slate-900 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${color}`}>{label}</span>
                    {fuelData?.lastUpdated && (
                      <span className="text-xs text-slate-500">
                        {formatTimeAgo(fuelData.lastUpdated)}
                      </span>
                    )}
                  </div>
                  <FuelBadge 
                    available={fuelData?.available}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Station Info */}
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Station Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Coordinates</span>
              <span className="text-slate-300 font-mono">
                {station.location?.coordinates?.[1]?.toFixed(6)}, {station.location?.coordinates?.[0]?.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Added</span>
              <span className="text-slate-300">
                {station.createdAt ? new Date(station.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Update Button */}
        <button
          onClick={onUpdateClick}
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" />
          Update Fuel Availability
        </button>
      </div>
    </div>
  );
};

export default StationDetail;
