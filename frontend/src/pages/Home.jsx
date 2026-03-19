/**
 * Home Page
 * Map view with nearby stations and radius filter
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Sliders, RefreshCw, AlertCircle } from 'lucide-react';
import MapView from '@/components/Map/MapView';
import StationCard from '@/components/Station/StationCard';
import UpdateForm from '@/components/FuelUpdate/UpdateForm';
import Modal from '@/components/UI/Modal';
import { StationListSkeleton } from '@/components/UI/Loader';
import { useStations } from '@/context/StationContext';
import { useLocation } from '@/context/LocationContext';
import useNearbyStations from '@/hooks/useNearbyStations';
import useSocket from '@/hooks/useSocket';
import { useToast } from '@/components/UI/Toast';

const Home = () => {
  const navigate = useNavigate();
  const { updateStationFuel } = useStations();
  const { location: userLocation, permissionStatus, getCurrentPosition, error: locationError } = useLocation();
  const { success: showSuccess } = useToast();

  // State
  const [radius, setRadius] = useState(5);
  const [debouncedRadius, setDebouncedRadius] = useState(5);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showRadiusPanel, setShowRadiusPanel] = useState(false);

  // Debounce radius changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRadius(radius);
    }, 500);
    return () => clearTimeout(handler);
  }, [radius]);

  // Fetch nearby stations
  const {
    stations: nearbyStations,
    loading: stationsLoading,
    error: stationsError,
    refetch: refetchStations,
    stats
  } = useNearbyStations(userLocation, { radius: debouncedRadius, autoFetch: true });

  // Socket for real-time updates
  useSocket({
    onFuelUpdate: (data) => {
      updateStationFuel(data);
      if (selectedStation?._id === data.stationId) {
        showSuccess(
          `${data.stationName} - ${formatFuelType(data.fuelType)} updated`,
          { title: 'Fuel Update', duration: 3000 }
        );
      }
    }
  });

  // Handle station selection (from map or list) and open quick update modal
  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
    setShowUpdateModal(true);
  }, []);

  // Handle update button click
  const handleUpdateClick = useCallback((station) => {
    setSelectedStation(station);
    setShowUpdateModal(true);
  }, []);

  // Handle update success
  const handleUpdateSuccess = useCallback(() => {
    setShowUpdateModal(false);
    refetchStations();
  }, [refetchStations]);

  // Format fuel type for display
  const formatFuelType = (type) => {
    const formats = {
      superDiesel: 'Super Diesel',
      diesel: 'Diesel',
      superPetrol: 'Super Petrol',
      petrol: 'Petrol'
    };
    return formats[type] || type;
  };

  // Request location if denied
  const handleRequestLocation = async () => {
    try {
      await getCurrentPosition();
    } catch (err) {
      // Error handled by context
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      {/* Map Section */}
      <div className="flex-1 relative min-h-[50vh] lg:min-h-0">
        <MapView
          stations={nearbyStations}
          height="100%"
          showUserLocation={true}
          onStationSelect={handleStationSelect}
          selectedStation={selectedStation}
        />

        {/* Radius Control */}
        <button
          onClick={() => setShowRadiusPanel(!showRadiusPanel)}
          className="absolute top-4 right-4 z-[400] bg-slate-900 text-white p-3 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
        >
          <Sliders className="w-5 h-5" />
        </button>

        {/* Radius Panel */}
        {showRadiusPanel && (
          <div className="absolute top-16 right-4 z-[400] bg-slate-900 rounded-lg shadow-lg p-4 w-64">
            <label className="text-white font-medium mb-2 block">
              Search Radius: {radius} km
            </label>
            <input
              type="range"
              min="1"
              max="25"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 km</span>
              <span>25 km</span>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={refetchStations}
          disabled={stationsLoading}
          className="absolute bottom-4 right-4 z-[400] bg-slate-900 text-white p-3 rounded-lg shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${stationsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sidebar - Station List */}
      <div className="w-full lg:w-[400px] xl:w-[450px] bg-slate-900 border-l border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            Nearby Stations
          </h2>

          {/* Stats */}
          <div className="flex gap-3 mt-2 text-sm">
            <span className="text-green-400">{stats.available} Available</span>
            <span className="text-red-400">{stats.unavailable} Out</span>
            <span className="text-amber-400">{stats.mixed} Mixed</span>
          </div>

          {/* Location Status */}
          {permissionStatus === 'denied' && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-red-400 font-medium">Location Access Denied</p>
                <button
                  onClick={handleRequestLocation}
                  className="text-red-300 underline hover:text-red-200"
                >
                  Enable location to see nearby stations
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Station List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {stationsLoading ? (
            <StationListSkeleton count={5} />
          ) : stationsError ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">{stationsError}</p>
              <button
                onClick={refetchStations}
                className="text-amber-500 hover:text-amber-400 underline"
              >
                Try again
              </button>
            </div>
          ) : nearbyStations.length === 0 ? (
            <div className="text-center py-8">
              <Navigation className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No stations found nearby</p>
              <p className="text-slate-500 text-sm">
                Try increasing the search radius or check your location
              </p>
            </div>
          ) : (
            nearbyStations.map(station => (
              <StationCard
                key={station._id}
                station={station}
                onSelect={handleStationSelect}
              />
            ))
          )}
        </div>
      </div>

      {/* Update Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Fuel Availability"
        size="md"
      >
        {selectedStation && (
          <UpdateForm
            station={selectedStation}
            onSuccess={handleUpdateSuccess}
            onCancel={() => setShowUpdateModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Home;
