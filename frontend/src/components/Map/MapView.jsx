/**
 * MapView Component
 * Main Leaflet map component with stations and user location
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StationMarker from './StationMarker';
import UserLocationMarker from './UserLocationMarker';
import { useStations } from '@/context/StationContext';
import { useLocation } from '@/context/LocationContext';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Map controller component for programmatic control
const MapController = ({ center, zoom, flyToStation }) => {
  const map = useMap();
  const hasInitialized = useRef(false);

  // Fly to station when selected
  useEffect(() => {
    if (flyToStation?.location?.coordinates) {
      const [lng, lat] = flyToStation.location.coordinates;
      map.flyTo([lat, lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [flyToStation, map]);

  // Center map when the center prop changes (e.g. user location arrives)
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom() < zoom ? zoom : map.getZoom());
    }
  }, [center[0], center[1], map]);

  return null;
};

// Map events handler
const MapEvents = ({ onMapClick, onBoundsChange }) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick?.(e);
    },
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange?.(bounds);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange?.(bounds);
    }
  });
  return null;
};

const MapView = ({
  stations = [],
  height = '100%',
  showUserLocation = true,
  onStationSelect,
  selectedStation,
  onMapClick,
  className = ''
}) => {
  const { location: userLocation } = useLocation();
  const { selectStation } = useStations();
  const [mapBounds, setMapBounds] = useState(null);

  // Default center (Colombo, Sri Lanka)
  const defaultCenter = [6.9271, 79.8612];
  const defaultZoom = 13;

  // Sri Lanka Map Bounds
  const sriLankaBounds = [
    [5.91, 79.51], // South-West
    [9.85, 81.88]  // North-East
  ];

  // Determine map center based on user location or default
  const mapCenter = useMemo(() => {
    if (userLocation?.lat && userLocation?.lng) {
      return [userLocation.lat, userLocation.lng];
    }
    return defaultCenter;
  }, [userLocation]);

  // Handle station marker click
  const handleStationClick = (station) => {
    selectStation(station);
    onStationSelect?.(station);
  };

  // Filter visible stations based on map bounds (performance optimization)
  const visibleStations = useMemo(() => {
    if (!mapBounds) return stations;
    
    return stations.filter(station => {
      const coords = station.location?.coordinates;
      if (!coords) return false;
      const [lng, lat] = coords;
      return mapBounds.contains([lat, lng]);
    });
  }, [stations, mapBounds]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={defaultZoom}
        minZoom={7}
        maxBounds={sriLankaBounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        className="z-0"
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Map controller for programmatic control */}
        <MapController
          center={mapCenter}
          zoom={defaultZoom}
          flyToStation={selectedStation}
        />

        {/* Map events */}
        <MapEvents
          onMapClick={onMapClick}
          onBoundsChange={setMapBounds}
        />

        {/* User location marker */}
        {showUserLocation && userLocation && (
          <UserLocationMarker
            position={[userLocation.lat, userLocation.lng]}
            accuracy={userLocation.accuracy}
          />
        )}

        {/* Station markers */}
        {visibleStations.map((station) => (
          <StationMarker
            key={station._id}
            station={station}
            isSelected={selectedStation?._id === station._id}
            onClick={() => handleStationClick(station)}
            onUpdateClick={() => handleStationClick(station)}
          />
        ))}
      </MapContainer>

      {/* Map overlay info */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-400">
        <span className="text-amber-500 font-medium">{visibleStations.length}</span> stations visible
      </div>
    </div>
  );
};

export default MapView;
