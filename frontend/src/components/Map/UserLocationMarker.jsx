/**
 * UserLocationMarker Component
 * Shows user's current location on the map with accuracy circle
 */

import React from 'react';
import { Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Crosshair } from 'lucide-react';

/**
 * Create custom user location marker icon
 */
const createUserIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" fill-opacity="0.3" />
      <circle cx="12" cy="12" r="6" fill="#3B82F6" />
      <circle cx="12" cy="12" r="3" fill="white" />
    </svg>
  `;

  return L.divIcon({
    className: 'user-location-marker',
    html: svg,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const UserLocationMarker = ({ position, accuracy = 0 }) => {
  const icon = createUserIcon();

  return (
    <>
      {/* Accuracy circle */}
      {accuracy > 0 && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            color: '#3B82F6',
            weight: 1,
            opacity: 0.3
          }}
        />
      )}

      {/* User marker */}
      <Marker position={position} icon={icon} zIndexOffset={1000}>
        <Popup className="user-popup">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Your Location</h4>
                <p className="text-xs text-slate-500">
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              </div>
            </div>
            {accuracy > 0 && (
              <div className="flex items-center gap-1 text-blue-600 text-sm">
                <Crosshair className="w-4 h-4" />
                <span>Accuracy: ±{Math.round(accuracy)}m</span>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default UserLocationMarker;
