import React, { useEffect, useState, useRef } from 'react';
import useNearbyStations from '@/hooks/useNearbyStations';
import { useLocation } from '@/context/LocationContext';
import { useToast } from '@/components/UI/Toast';
import { formatTimeAgo } from '@/utils/distance';
import { useNavigate } from 'react-router-dom';

const LocationNotifier = () => {
    const { location: userLocation } = useLocation();
    const { stations } = useNearbyStations(userLocation, { radius: 0.5 }); // 500m radius
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Keep track of stations we've already notified the user about
    const notifiedStationsRef = useRef(new Set());
    const lastNotifyTimeRef = useRef(0);

    useEffect(() => {
        if (!userLocation || stations.length === 0) return;

        // Rate limit notifications (max 1 every 5 minutes)
        const now = Date.now();
        if (now - lastNotifyTimeRef.current < 5 * 60 * 1000) return;

        // Find the nearest station within 500m
        const nearest = stations[0]; // Already sorted by distance in hook
        if (!nearest || nearest.distance > 0.5) return;

        // Skip if we already asked about this station recently
        if (notifiedStationsRef.current.has(nearest._id)) return;

        // Check if the station needs an update (either untested or updated >1 hour ago)
        let needsUpdate = false;
        if (!nearest.fuel) {
            needsUpdate = true;
        } else {
            const times = Object.values(nearest.fuel)
                .map(f => f?.lastUpdated)
                .filter(Boolean);

            if (times.length === 0) {
                needsUpdate = true;
            } else {
                const lastUpdatedTime = Math.max(...times.map(t => new Date(t).getTime()));
                const hoursSinceUpdate = (now - lastUpdatedTime) / (1000 * 60 * 60);
                if (hoursSinceUpdate > 1) {
                    needsUpdate = true;
                }
            }
        }

        if (needsUpdate) {
            lastNotifyTimeRef.current = now;
            notifiedStationsRef.current.add(nearest._id);

            showToast({
                type: 'info',
                title: 'You are near a fuel station!',
                message: `Could you kindly share the fuel status for ${nearest.name}?`,
                duration: 15000,
                action: {
                    label: 'Update Info',
                    onClick: () => {
                        // Navigate to station detail page and ideally open the modal
                        navigate(`/station/${nearest._id}`);
                    }
                }
            });
        }
    }, [userLocation, stations, showToast, navigate]);

    return null; // Invisible component
};

export default LocationNotifier;
