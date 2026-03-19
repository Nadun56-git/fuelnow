/**
 * Distance Utility Functions
 * Client-side geospatial calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Validate inputs
  if (typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lng2 !== 'number') {
    throw new Error('All coordinates must be numbers');
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
export const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if user is within proximity radius of a station
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {number} stationLat - Station's latitude
 * @param {number} stationLng - Station's longitude
 * @param {number} radiusKm - Maximum allowed distance (default: 0.5 km = 500m)
 * @returns {boolean} True if within radius
 */
export const isWithinProximity = (userLat, userLng, stationLat, stationLng, radiusKm = 0.5) => {
  try {
    const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
    return distance <= radiusKm;
  } catch (error) {
    console.error('Error checking proximity:', error.message);
    return false;
  }
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return 'Unknown distance';
  }

  if (distanceKm < 0.1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }
  return `${Math.round(distanceKm)} km away`;
};

/**
 * Format time elapsed since a date
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string (e.g., "5 min ago")
 */
export const formatTimeAgo = (date) => {
  if (!date) return 'Never updated';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return then.toLocaleDateString();
};

/**
 * Sort stations by availability (available > mixed > unknown > unavailable)
 * and then by distance from a reference point
 * @param {Array} stations - Array of station objects
 * @param {number} refLat - Reference latitude
 * @param {number} refLng - Reference longitude
 * @returns {Array} Sorted stations
 */
export const sortByDistanceAndAvailability = (stations, refLat, refLng) => {
  if (!Array.isArray(stations)) return [];

  return [...stations].map(station => {
    const stationLng = station.location?.coordinates?.[0];
    const stationLat = station.location?.coordinates?.[1];

    let distance = null;
    if (stationLat !== undefined && stationLng !== undefined && refLat != null && refLng != null) {
      try {
        distance = calculateDistance(refLat, refLng, stationLat, stationLng);
      } catch (error) {
        console.warn(`Could not calculate distance for station ${station._id}`);
      }
    }

    // Calculate availability score for sorting
    // 3: Available (at least one fuel type available, none out of stock)
    // 2: Mixed (some available, some out of stock)
    // 1: Unknown (no updates for any fuel type)
    // 0: Unavailable (all reported types are out of stock)
    let sortScore = 1; // Default to unknown
    if (station.fuel) {
      const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
      const statuses = types.map(t => station.fuel[t]?.available);

      const available = statuses.filter(s => s === true).length;
      const unavailable = statuses.filter(s => s === false).length;
      const unknown = statuses.filter(s => s === null || s === undefined).length;

      if (unknown === 4) sortScore = 1;
      else if (available === 0 && unavailable > 0) sortScore = 0;
      else if (available > 0 && unavailable === 0) sortScore = 3;
      else sortScore = 2;
    }

    return { ...station, distance, sortScore };
  }).sort((a, b) => {
    // 1. Sort by availability score (descending)
    if (a.sortScore !== b.sortScore) {
      return b.sortScore - a.sortScore;
    }

    // 2. Sort by distance (ascending)
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
};

/**
 * Filter stations by maximum distance
 * @param {Array} stations - Array of station objects with distance property
 * @param {number} maxDistanceKm - Maximum distance in km
 * @returns {Array} Filtered stations
 */
export const filterByDistance = (stations, maxDistanceKm) => {
  if (!Array.isArray(stations)) return [];
  return stations.filter(s => s.distance !== null && s.distance <= maxDistanceKm);
};

/**
 * Get availability status color
 * @param {Object} fuel - Fuel availability object
 * @returns {string} Color code
 */
export const getAvailabilityColor = (fuel) => {
  if (!fuel) return '#9CA3AF'; // gray for unknown

  const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const statuses = types.map(type => fuel[type]?.available);

  const availableCount = statuses.filter(s => s === true).length;
  const unavailableCount = statuses.filter(s => s === false).length;
  const unknownCount = statuses.filter(s => s === null || s === undefined).length;

  if (unknownCount === 4) return '#9CA3AF'; // gray
  if (availableCount === 0 && unavailableCount > 0) return '#EF4444'; // red
  if (availableCount > 0 && unavailableCount === 0) return '#22C55E'; // green
  return '#EAB308'; // yellow for mixed
};

/**
 * Get availability status label
 * @param {Object} fuel - Fuel availability object
 * @returns {string} Status label
 */
export const getAvailabilityLabel = (fuel) => {
  if (!fuel) return 'Unknown';

  const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const statuses = types.map(type => fuel[type]?.available);

  const availableCount = statuses.filter(s => s === true).length;
  const unavailableCount = statuses.filter(s => s === false).length;
  const unknownCount = statuses.filter(s => s === null || s === undefined).length;

  if (unknownCount === 4) return 'Unknown';
  if (availableCount === 0 && unavailableCount > 0) return 'Unavailable';
  if (availableCount > 0 && unavailableCount === 0) return 'Available';
  return 'Mixed';
};
