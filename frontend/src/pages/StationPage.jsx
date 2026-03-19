/**
 * StationPage
 * Individual station detail page
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Fuel, History, Loader2, AlertCircle } from 'lucide-react';
import MapView from '@/components/Map/MapView';
import StationDetail from '@/components/Station/StationDetail';
import UpdateForm from '@/components/FuelUpdate/UpdateForm';
import Modal from '@/components/UI/Modal';
import { FullScreenLoader } from '@/components/UI/Loader';
import { useStations } from '@/context/StationContext';
import { useLocation } from '@/context/LocationContext';
import useSocket from '@/hooks/useSocket';
import { useToast } from '@/components/UI/Toast';
import { formatTimeAgo } from '@/utils/distance';

const StationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location: userLocation } = useLocation();
  const { success: showSuccess } = useToast();
  
  const { 
    selectedStation, 
    fetchStationById, 
    updateStationFuel,
    loading,
    error 
  } = useStations();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateHistory, setUpdateHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch station on mount
  useEffect(() => {
    if (id) {
      fetchStationById(id, userLocation ? {
        lat: userLocation.lat,
        lng: userLocation.lng
      } : {});
      fetchUpdateHistory();
    }
  }, [id, fetchStationById, userLocation]);

  // Socket for real-time updates
  useSocket({
    onFuelUpdate: (data) => {
      if (data.stationId === id) {
        updateStationFuel(data);
        showSuccess(
          `${formatFuelType(data.fuelType)} updated`,
          { title: 'Station Updated', duration: 3000 }
        );
        fetchUpdateHistory();
      }
    }
  });

  // Fetch update history
  const fetchUpdateHistory = async () => {
    setHistoryLoading(true);
    try {
      const { fuelApi } = await import('@/api/stationApi');
      const response = await fuelApi.getHistory(id, { limit: 10 });
      setUpdateHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format fuel type
  const formatFuelType = (type) => {
    const formats = {
      superDiesel: 'Super Diesel',
      diesel: 'Diesel',
      superPetrol: 'Super Petrol',
      petrol: 'Petrol'
    };
    return formats[type] || type;
  };

  // Handle update success
  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    fetchStationById(id, userLocation ? {
      lat: userLocation.lat,
      lng: userLocation.lng
    } : {});
    fetchUpdateHistory();
  };

  if (loading) {
    return <FullScreenLoader message="Loading station..." />;
  }

  if (error || !selectedStation) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Station Not Found</h1>
          <p className="text-slate-400 mb-6">
            {error || "The station you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => navigate('/stations')}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors"
          >
            Back to Stations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900">
      {/* Back Button */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Station Details */}
          <div className="space-y-6">
            <StationDetail
              station={selectedStation}
              onUpdateClick={() => setShowUpdateModal(true)}
            />

            {/* Update History */}
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" />
                  Recent Updates
                </h3>
              </div>
              
              <div className="p-6">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                ) : updateHistory.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    No updates yet for this station
                  </p>
                ) : (
                  <div className="space-y-3">
                    {updateHistory.map((update, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`
                            w-2 h-2 rounded-full
                            ${update.available ? 'bg-green-500' : 'bg-red-500'}
                          `} />
                          <span className="text-slate-300">
                            {formatFuelType(update.fuelType)}
                          </span>
                        </div>
                        <span className="text-slate-500 text-sm">
                          {formatTimeAgo(update.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="h-[400px] lg:h-auto lg:min-h-[600px]">
            <MapView
              stations={[selectedStation]}
              height="100%"
              showUserLocation={true}
              selectedStation={selectedStation}
            />
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Fuel Availability"
        size="md"
      >
        <UpdateForm
          station={selectedStation}
          onSuccess={handleUpdateSuccess}
          onCancel={() => setShowUpdateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default StationPage;
