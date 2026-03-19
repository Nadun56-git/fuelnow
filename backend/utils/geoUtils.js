/**
 * Geospatial Utility Functions
 * Haversine formula for distance calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Validate inputs
  if (typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
      typeof lat2 !== 'number' || typeof lng2 !== 'number') {
    throw new Error('All coordinates must be numbers');
  }

  // Validate coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
    throw new Error('Longitude must be between -180 and 180');
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
const toRadians = (degrees) => {
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
const isWithinProximity = (userLat, userLng, stationLat, stationLng, radiusKm = 0.5) => {
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
const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return 'Unknown distance';
  }
  
  if (distanceKm < 0.1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m away`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }
  return `${Math.round(distanceKm)} km away`;
};

/**
 * Sort stations by distance from a reference point
 * @param {Array} stations - Array of station objects with location.coordinates
 * @param {number} refLat - Reference latitude
 * @param {number} refLng - Reference longitude
 * @returns {Array} Sorted stations with distance property added
 */
const sortStationsByDistance = (stations, refLat, refLng) => {
  if (!Array.isArray(stations)) {
    throw new Error('Stations must be an array');
  }

  return stations.map(station => {
    const stationLng = station.location?.coordinates?.[0];
    const stationLat = station.location?.coordinates?.[1];
    
    let distance = null;
    if (stationLat !== undefined && stationLng !== undefined) {
      try {
        distance = calculateDistance(refLat, refLng, stationLat, stationLng);
      } catch (error) {
        console.warn(`Could not calculate distance for station ${station._id}:`, error.message);
      }
    }
    
    return {
      ...station.toObject ? station.toObject() : station,
      distance
    };
  }).sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });
};

/**
 * Validate coordinates
 * @param {*} lat - Latitude
 * @param {*} lng - Longitude
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
const validateCoordinates = (lat, lng) => {
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return { valid: false, error: 'Both latitude and longitude are required' };
  }
  
  const numLat = Number(lat);
  const numLng = Number(lng);
  
  if (isNaN(numLat) || isNaN(numLng)) {
    return { valid: false, error: 'Coordinates must be valid numbers' };
  }
  
  if (numLat < -90 || numLat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }
  
  if (numLng < -180 || numLng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }
  
  return { valid: true, lat: numLat, lng: numLng };
};

module.exports = {
  calculateDistance,
  toRadians,
  isWithinProximity,
  formatDistance,
  sortStationsByDistance,
  validateCoordinates
};
