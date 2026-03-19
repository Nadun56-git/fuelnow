/**
 * useNearbyStations Hook
 * Fetches and manages stations near a given location within a radius
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sortByDistanceAndAvailability, filterByDistance } from '@/utils/distance';

const useNearbyStations = (userLocation, options = {}) => {
    const { radius = 5, autoFetch = true } = options;

    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ available: 0, unavailable: 0, mixed: 0, unknown: 0 });

    const abortRef = useRef(null);

    const computeStats = (list) => {
        const result = { available: 0, unavailable: 0, mixed: 0, unknown: 0 };
        list.forEach((station) => {
            const fuel = station.fuel;
            if (!fuel) { result.unknown++; return; }
            const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
            const statuses = types.map((t) => fuel[t]?.available);
            const avail = statuses.filter((s) => s === true).length;
            const unavail = statuses.filter((s) => s === false).length;
            const unk = statuses.filter((s) => s === null || s === undefined).length;
            if (unk === 4) result.unknown++;
            else if (avail === 0 && unavail > 0) result.unavailable++;
            else if (avail > 0 && unavail === 0) result.available++;
            else result.mixed++;
        });
        return result;
    };

    const fetchStations = useCallback(async () => {
        if (!userLocation) return;

        // Cancel previous in-flight request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                lat: userLocation.lat,
                lng: userLocation.lng,
                radius,
            });

            const res = await fetch(`/api/stations/nearby?${params}`, {
                signal: controller.signal,
            });

            if (!res.ok) throw new Error('Failed to fetch nearby stations');

            const json = await res.json();
            const raw = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

            // Sort by availability and distance, then filter by radius client-side as a safety net
            const sorted = sortByDistanceAndAvailability(raw, userLocation.lat, userLocation.lng);
            const filtered = filterByDistance(sorted, radius);

            setStations(filtered);
            setStats(computeStats(filtered));
            setLoading(false);
        } catch (err) {
            if (err.name === 'AbortError') return; // Ignore aborted requests
            setError(err.message);
            setLoading(false);
        }
    }, [userLocation, radius]);

    useEffect(() => {
        if (autoFetch) {
            fetchStations();
        }
        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [fetchStations, autoFetch]);

    return {
        stations,
        loading,
        error,
        stats,
        refetch: fetchStations,
    };
};

export default useNearbyStations;
