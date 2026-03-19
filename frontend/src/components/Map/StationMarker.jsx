/**
 * StationMarker Component
 * Custom marker for fuel stations with color-coded availability
 */

import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Fuel, MapPin, Clock, Navigation } from 'lucide-react';
import { formatDistance, formatTimeAgo, getAvailabilityColor, getAvailabilityLabel } from '@/utils/distance';

/**
 * Create custom marker icon based on availability status
 */
const createMarkerIcon = (status, isSelected) => {
  const colors = {
    available: '#22C55E',   // green
    unavailable: '#EF4444', // red
    mixed: '#EAB308',       // yellow
    unknown: '#9CA3AF'      // gray
  };

  const color = colors[status] || colors.unknown;
  const size = isSelected ? 40 : 32;
  const strokeWidth = isSelected ? 3 : 2;

  // Create SVG marker
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 24 34">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path 
        d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22c0-6.6-5.4-12-12-12z" 
        fill="${color}" 
        stroke="white" 
        stroke-width="${strokeWidth}"
        filter="url(#shadow)"
      />
      <circle cx="12" cy="12" r="5" fill="white"/>
      <text x="12" y="15" text-anchor="middle" font-size="8" fill="${color}">⛽</text>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-station-marker',
    html: svg,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -size - 5]
  });
};

/**
 * Get availability status from fuel data
 */
const getStatus = (fuel) => {
  if (!fuel) return 'unknown';
  
  const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const statuses = types.map(type => fuel[type]?.available);
  
  const availableCount = statuses.filter(s => s === true).length;
  const unavailableCount = statuses.filter(s => s === false).length;
  const unknownCount = statuses.filter(s => s === null || s === undefined).length;
  
  if (unknownCount === 4) return 'unknown';
  if (availableCount === 0 && unavailableCount > 0) return 'unavailable';
  if (availableCount > 0 && unavailableCount === 0) return 'available';
  return 'mixed';
};

/**
 * Fuel type display names
 */
const FUEL_TYPE_LABELS = {
  superDiesel: 'Super Diesel',
  diesel: 'Diesel',
  superPetrol: 'Super Petrol',
  petrol: 'Petrol'
};

/**
 * Fuel badge component for popup
 */
const FuelBadge = ({ type, available, lastUpdated }) => {
  const getBadgeColor = () => {
    if (available === true) return 'bg-green-500 text-white';
    if (available === false) return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getStatusText = () => {
    if (available === true) return 'Available';
    if (available === false) return 'Out of Stock';
    return 'Unknown';
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-300">{FUEL_TYPE_LABELS[type]}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor()}`}>
          {getStatusText()}
        </span>
        {lastUpdated && (
          <span className="text-xs text-slate-500">
            {formatTimeAgo(lastUpdated)}
          </span>
        )}
      </div>
    </div>
  );
};

const StationMarker = ({ station, isSelected, onClick, onUpdateClick }) => {
  const coordinates = station.location?.coordinates;
  if (!coordinates || coordinates.length !== 2) return null;

  const [lng, lat] = coordinates;
  const status = getStatus(station.fuel);
  const icon = useMemo(() => createMarkerIcon(status, isSelected), [status, isSelected]);

  // Get most recent update time
  const getLastUpdated = () => {
    if (!station.fuel) return null;
    const times = Object.values(station.fuel)
      .map(f => f?.lastUpdated)
      .filter(Boolean);
    return times.length > 0 ? Math.max(...times.map(t => new Date(t))) : null;
  };

  const lastUpdated = getLastUpdated();

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup className="station-popup" maxWidth={300}>
        <div className="p-1 min-w-[250px]">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: getAvailabilityColor(station.fuel) }}
            >
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{station.name}</h3>
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{station.address}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          {station.distance !== undefined && (
            <div className="flex items-center gap-1 text-amber-600 text-sm mb-3">
              <Navigation className="w-4 h-4" />
              <span>{formatDistance(station.distance)}</span>
            </div>
          )}

          {/* Fuel Status */}
          <div className="border-t border-slate-200 pt-2 mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Fuel Availability
            </p>
            <div className="space-y-1">
              {['superDiesel', 'diesel', 'superPetrol', 'petrol'].map(type => (
                <FuelBadge
                  key={type}
                  type={type}
                  available={station.fuel?.[type]?.available}
                  lastUpdated={station.fuel?.[type]?.lastUpdated}
                />
              ))}
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
              <Clock className="w-3 h-3" />
              <span>Last updated: {formatTimeAgo(lastUpdated)}</span>
            </div>
          )}

          {/* Update Button */}
          <button
            onClick={() => {
              if (onUpdateClick) {
                onUpdateClick();
              } else if (onClick) {
                onClick();
              }
            }}
            className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors"
          >
            Update Availability
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default StationMarker;
