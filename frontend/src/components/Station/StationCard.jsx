/**
 * StationCard Component
 * Card display for station list views
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Clock, ExternalLink, Fuel } from 'lucide-react';
import { FuelStatusDots, StationStatusBadge } from './FuelBadge';
import { formatDistance, formatTimeAgo } from '@/utils/distance';

const StationCard = ({ 
  station, 
  onSelect,
  showDistance = true,
  className = ''
}) => {
  const navigate = useNavigate();

  // Get most recent update time
  const getLastUpdated = () => {
    if (!station.fuel) return null;
    const times = Object.values(station.fuel)
      .map(f => f?.lastUpdated)
      .filter(Boolean);
    return times.length > 0 ? new Date(Math.max(...times.map(t => new Date(t)))) : null;
  };

  const lastUpdated = getLastUpdated();

  // Handle card click
  const handleClick = () => {
    onSelect?.(station);
  };

  // Handle view details click
  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/station/${station._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-slate-800 rounded-xl p-4 cursor-pointer
        border border-slate-700 hover:border-amber-500/50
        transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${getStatusBgColor(station.fuel)}
        `}>
          <Fuel className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="font-bold text-white truncate mb-1">
            {station.name}
          </h3>

          {/* Address */}
          <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{station.address}</span>
          </div>

          {/* Distance & Status */}
          <div className="flex items-center gap-3 mb-3">
            {showDistance && station.distance !== undefined && (
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                <Navigation className="w-4 h-4" />
                <span>{formatDistance(station.distance)}</span>
              </div>
            )}
            <StationStatusBadge fuel={station.fuel} />
          </div>

          {/* Fuel Status Dots */}
          <div className="flex items-center justify-between">
            <FuelStatusDots fuel={station.fuel} />
            
            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleViewDetails}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-700 rounded-lg transition-colors"
          title="View details"
        >
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Get background color based on fuel status
 */
const getStatusBgColor = (fuel) => {
  if (!fuel) return 'bg-gray-500';
  
  const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const statuses = types.map(type => fuel[type]?.available);
  
  const available = statuses.filter(s => s === true).length;
  const unavailable = statuses.filter(s => s === false).length;
  const unknown = statuses.filter(s => s === null || s === undefined).length;
  
  if (unknown === 4) return 'bg-gray-500';
  if (available === 0 && unavailable > 0) return 'bg-red-500';
  if (available > 0 && unavailable === 0) return 'bg-green-500';
  return 'bg-amber-500';
};

export default StationCard;
