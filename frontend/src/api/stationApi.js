/**
 * stationApi
 * HTTP API helpers for stations and fuel updates
 */

const BASE = '/api';

/** Generic fetch wrapper with error handling */
const request = async (path, options = {}) => {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed (${res.status})`);
    }

    return data;
};

// ─── Stations ─────────────────────────────────────────────────────────────────

export const stationApi = {
    /** GET /api/stations - list all stations */
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/stations${qs ? `?${qs}` : ''}`);
    },

    /** GET /api/stations/nearby */
    getNearby: (lat, lng, radius = 5) =>
        request(`/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),

    /** GET /api/stations/:id */
    getById: (id, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/stations/${id}${qs ? `?${qs}` : ''}`);
    },
};

// ─── Fuel Updates ──────────────────────────────────────────────────────────────

export const fuelApi = {
    /**
     * POST /api/fuel-updates/:stationId/batch
     * Batch-update multiple fuel types at once.
     * @param {string} stationId
     * @param {{ updates: Array<{fuelType, available}>, userLat: number, userLng: number }} body
     */
    batchUpdate: (stationId, body) =>
        request(`/fuel-updates/${stationId}/batch`, { method: 'POST', body }),

    /**
     * POST /api/fuel-updates/:stationId
     * Update a single fuel type.
     */
    update: (stationId, body) =>
        request(`/fuel-updates/${stationId}`, { method: 'POST', body }),

    /**
     * GET /api/fuel-updates/:stationId/history
     */
    getHistory: (stationId, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/fuel-updates/${stationId}/history${qs ? `?${qs}` : ''}`);
    },
};

export default { stationApi, fuelApi };
