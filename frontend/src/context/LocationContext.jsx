/**
 * LocationContext
 * Manages user's geolocation state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null); // { lat, lng }
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const getCurrentPosition = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = 'Geolocation is not supported by your browser';
                setError(err);
                reject(new Error(err));
                return;
            }

            setLoading(true);
            setError(null);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(coords);
                    setPermissionStatus('granted');
                    setLoading(false);
                    resolve(coords);
                },
                (err) => {
                    const msg = err.code === 1 ? 'Location access denied' : 'Unable to determine your location';
                    setError(msg);
                    setPermissionStatus(err.code === 1 ? 'denied' : 'prompt');
                    setLoading(false);
                    reject(new Error(msg));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }, []);

    // Auto-request on mount
    useEffect(() => {
        // Check permission state if the API is available
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                if (result.state === 'granted' || result.state === 'prompt') {
                    getCurrentPosition().catch(() => { });
                }
                result.onchange = () => {
                    setPermissionStatus(result.state);
                };
            });
        } else {
            // Fallback: just try to get position
            getCurrentPosition().catch(() => { });
        }
    }, [getCurrentPosition]);

    return (
        <LocationContext.Provider
            value={{
                location,
                permissionStatus,
                error,
                loading,
                getCurrentPosition,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
    return ctx;
};

export default LocationContext;
