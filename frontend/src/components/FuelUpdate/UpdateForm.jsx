/**
 * UpdateForm Component
 * Form for updating fuel availability at a station
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Navigation, Loader2, CheckCircle } from 'lucide-react';
import FuelTypeSelector from './FuelTypeSelector';
import { useLocation } from '@/context/LocationContext';
import { fuelApi } from '@/api/stationApi';
import { useToast } from '@/components/UI/Toast';
import { isWithinProximity } from '@/utils/distance';

const PROXIMITY_RADIUS_KM = 0.5; // 500 meters

const UpdateForm = ({ station, onSuccess, onCancel }) => {
  const { location: userLocation, loading: locationLoading, getCurrentPosition } = useLocation();
  const { success: showSuccess, error: showError } = useToast();

  // Form state
  const [fuelStatus, setFuelStatus] = useState({
    superDiesel: null,
    diesel: null,
    superPetrol: null,
    petrol: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);

  // Fuel type configurations
  const fuelTypes = [
    { key: 'superDiesel', label: 'Super Diesel' },
    { key: 'diesel', label: 'Diesel' },
    { key: 'superPetrol', label: 'Super Petrol' },
    { key: 'petrol', label: 'Petrol' }
  ];

  // Check if at least one fuel type is selected
  const hasSelection = Object.values(fuelStatus).some(v => v !== null);

  // Handle fuel type change
  const handleFuelChange = (type, value) => {
    setFuelStatus(prev => ({ ...prev, [type]: value }));
  };

  // Quick actions
  const markAll = (status) => {
    const newStatus = {};
    fuelTypes.forEach(t => newStatus[t.key] = status);
    setFuelStatus(newStatus);
  };

  // Get fresh location before submitting
  const ensureLocation = async () => {
    setCheckingLocation(true);
    try {
      if (!userLocation) {
        await getCurrentPosition();
      }
      return true;
    } catch (err) {
      showError('Could not get your location. Please enable location services.');
      return false;
    } finally {
      setCheckingLocation(false);
    }
  };

  // Check proximity to station
  const checkProximity = () => {
    if (!userLocation || !station?.location?.coordinates) return false;

    const [stationLng, stationLat] = station.location.coordinates;
    return isWithinProximity(
      userLocation.lat,
      userLocation.lng,
      stationLat,
      stationLng,
      PROXIMITY_RADIUS_KM
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one selection
    if (!hasSelection) {
      showError('Please select at least one fuel type to update');
      return;
    }

    // Ensure we have location
    const hasLocation = await ensureLocation();
    if (!hasLocation) return;

    // Check proximity
    const isNear = checkProximity();
    if (!isNear) {
      showError(
        'You must be within 500 meters of the station to update fuel availability',
        { title: 'Too Far Away' }
      );
      return;
    }

    // Submit updates
    setSubmitting(true);

    try {
      // Build updates array for batch update
      const updates = Object.entries(fuelStatus)
        .filter(([_, value]) => value !== null)
        .map(([fuelType, available]) => ({
          fuelType,
          available
        }));

      await fuelApi.batchUpdate(station._id, {
        updates,
        userLat: userLocation.lat,
        userLng: userLocation.lng
      });

      showSuccess(
        `Fuel availability updated for ${station.name}`,
        { title: 'Update Successful' }
      );

      onSuccess?.();
    } catch (err) {
      console.error('Update error:', err);
      showError(
        err.message || 'Failed to update fuel availability',
        { title: 'Update Failed' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Get proximity status message
  const getProximityMessage = () => {
    if (!userLocation) {
      return { text: 'Getting your location...', color: 'text-amber-500' };
    }

    const isNear = checkProximity();
    if (isNear) {
      return { text: '✓ You are near this station', color: 'text-green-500' };
    }
    return {
      text: '⚠ You must be within 500m to update',
      color: 'text-red-500'
    };
  };

  const proximityInfo = getProximityMessage();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Station Info */}
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="font-bold text-white">{station.name}</h3>
            <p className="text-sm text-slate-400 truncate">{station.address}</p>
          </div>
        </div>

        {/* Location Status */}
        <div className={`flex items-center gap-2 text-sm ${proximityInfo.color} mt-3`}>
          <Navigation className="w-4 h-4" />
          <span>{proximityInfo.text}</span>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-amber-400 font-medium">Important</p>
          <p className="text-amber-300/80">
            You must be physically present at the station (within 500m) to update fuel availability.
            Please provide accurate information to help others.
          </p>
        </div>
      </div>

      {/* Fuel Type Selectors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold text-white">Select Fuel Availability</h4>

          {/* Quick actions for easier updates */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => markAll(true)}
              className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/40 hover:bg-green-500/20 transition-colors"
            >
              All Available
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 transition-colors"
            >
              All Out
            </button>
            <button
              type="button"
              onClick={() => markAll(null)}
              className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {fuelTypes.map(({ key, label, isOptional }) => (
          <FuelTypeSelector
            key={key}
            label={label}
            selected={fuelStatus[key]}
            onChange={(value) => handleFuelChange(key, value)}
            isOptional={isOptional}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !hasSelection || checkingLocation}
          className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Update
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UpdateForm;
