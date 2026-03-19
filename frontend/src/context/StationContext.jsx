/**
 * StationContext
 * Global state management for fuel stations
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const StationContext = createContext(null);

export const StationProvider = ({ children }) => {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all stations (optionally with lat/lng for distance sorting)
    const fetchStations = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`/api/stations${query ? `?${query}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch stations');
            const json = await res.json();
            const list = json.data ?? json.stations ?? json;
            setStations(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch a single station by ID
    const fetchStationById = useCallback(async (id, params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`/api/stations/${id}${query ? `?${query}` : ''}`);
            if (!res.ok) throw new Error('Station not found');
            const json = await res.json();
            setSelectedStation(json.data ?? json.station ?? json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Apply a real-time fuel update from Socket.IO
    const updateStationFuel = useCallback((data) => {
        const applyUpdate = (station) => {
            if (station._id !== data.stationId) return station;
            return {
                ...station,
                fuel: {
                    ...station.fuel,
                    [data.fuelType]: {
                        available: data.available,
                        lastUpdated: data.timestamp || new Date().toISOString(),
                    },
                },
            };
        };

        setStations((prev) => prev.map(applyUpdate));
        setSelectedStation((prev) => (prev ? applyUpdate(prev) : prev));
    }, []);

    return (
        <StationContext.Provider
            value={{
                stations,
                selectedStation,
                loading,
                error,
                fetchStations,
                fetchStationById,
                updateStationFuel,
            }}
        >
            {children}
        </StationContext.Provider>
    );
};

export const useStations = () => {
    const ctx = useContext(StationContext);
    if (!ctx) throw new Error('useStations must be used within a StationProvider');
    return ctx;
};

export default StationContext;
