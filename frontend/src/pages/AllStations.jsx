/**
 * AllStations Page
 * List view of all fuel stations with search
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, List, Grid3X3 } from 'lucide-react';
import StationCard from '@/components/Station/StationCard';
import UpdateForm from '@/components/FuelUpdate/UpdateForm';
import Modal from '@/components/UI/Modal';
import { StationListSkeleton } from '@/components/UI/Loader';
import { useStations } from '@/context/StationContext';
import { useLocation } from '@/context/LocationContext';
import useSocket from '@/hooks/useSocket';
import { useToast } from '@/components/UI/Toast';
import { sortByDistanceAndAvailability } from '@/utils/distance';

const AllStations = () => {
  const {
    stations,
    loading,
    error,
    fetchStations,
    updateStationFuel
  } = useStations();
  const { location: userLocation } = useLocation();
  const { success: showSuccess } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'available', 'unavailable', 'mixed'
  const [selectedStation, setSelectedStation] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Fetch stations on mount
  useEffect(() => {
    fetchStations(userLocation ? {
      lat: userLocation.lat,
      lng: userLocation.lng
    } : {});
  }, [fetchStations, userLocation]);

  // Socket for real-time updates
  useSocket({
    onFuelUpdate: (data) => {
      updateStationFuel(data);
    }
  });

  // Filter and search stations
  const filteredStations = useCallback(() => {
    let result = [...stations];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(s => getAvailabilityStatus(s.fuel) === filterStatus);
    }

    // Apply combined sorting (availability > distance)
    if (userLocation) {
      result = sortByDistanceAndAvailability(result, userLocation.lat, userLocation.lng);
    } else {
      // Sort by availability only if we don't have location
      result = sortByDistanceAndAvailability(result, null, null);
    }

    return result;
  }, [stations, searchQuery, filterStatus, userLocation]);

  // Get availability status
  const getAvailabilityStatus = (fuel) => {
    if (!fuel) return 'unknown';
    const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
    const statuses = types.map(type => fuel[type]?.available);
    const available = statuses.filter(s => s === true).length;
    const unavailable = statuses.filter(s => s === false).length;
    const unknown = statuses.filter(s => s === null || s === undefined).length;

    if (unknown === 4) return 'unknown';
    if (available === 0 && unavailable > 0) return 'unavailable';
    if (available > 0 && unavailable === 0) return 'available';
    return 'mixed';
  };

  // Handle station selection (card click) and open quick update modal
  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
    setShowUpdateModal(true);
  }, []);

  // Handle update success
  const handleUpdateSuccess = useCallback(() => {
    setShowUpdateModal(false);
    fetchStations(userLocation ? {
      lat: userLocation.lat,
      lng: userLocation.lng
    } : {});
  }, [fetchStations, userLocation]);

  const displayedStations = filteredStations();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-6 h-6 text-amber-500" />
                All Stations
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {stations.length} stations across the network
              </p>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filter:</span>
            </div>

            {['all', 'available', 'unavailable', 'mixed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${filterStatus === status
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}

            <div className="flex-1" />

            {/* View Mode Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`
                  p-2 rounded transition-colors
                  ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}
                `}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`
                  p-2 rounded transition-colors
                  ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}
                `}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <StationListSkeleton count={8} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchStations()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : displayedStations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No stations found</p>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
            </p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
            }
          `}>
            {displayedStations.map(station => (
              <StationCard
                key={station._id}
                station={station}
                onSelect={handleStationSelect}
                showDistance={!!userLocation}
              />
            ))}
          </div>
        )}
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

export default AllStations;
