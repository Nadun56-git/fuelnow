/**
 * useSocket Hook
 * Manages a Socket.IO connection for real-time fuel updates
 */

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocket = ({ onFuelUpdate } = {}) => {
    const socketRef = useRef(null);
    const callbackRef = useRef(onFuelUpdate);

    // Keep callback ref up-to-date without re-running the effect
    useEffect(() => {
        callbackRef.current = onFuelUpdate;
    }, [onFuelUpdate]);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
        });

        socket.on('fuelUpdate', (data) => {
            if (callbackRef.current) {
                callbackRef.current(data);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, []); // Only run once on mount

    return socketRef.current;
};

export default useSocket;
