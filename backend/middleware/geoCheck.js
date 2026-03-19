/**
 * Geolocation Middleware
 * Validates that user is within proximity of a station before allowing updates
 */

const Station = require('../models/Station');
const { isWithinProximity, validateCoordinates } = require('../utils/geoUtils');

/**
 * Middleware to check if user is near the station they're trying to update
 * Requires: userLat, userLng in request body
 * Requires: station ID in request params (req.params.id)
 */
const checkProximity = async (req, res, next) => {
  try {
    const { userLat, userLng } = req.body;
    const { id: stationId } = req.params;
    
    // Validate coordinates are provided
    const coordValidation = validateCoordinates(userLat, userLng);
    if (!coordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user coordinates',
        error: coordValidation.error
      });
    }
    
    // Find the station
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    // Extract station coordinates (GeoJSON format: [longitude, latitude])
    const stationCoords = station.location?.coordinates;
    if (!stationCoords || stationCoords.length !== 2) {
      return res.status(500).json({
        success: false,
        message: 'Station has invalid coordinates'
      });
    }
    
    const [stationLng, stationLat] = stationCoords;
    
    // Check proximity (default 500m radius)
    const maxRadiusKm = parseFloat(process.env.PROXIMITY_RADIUS_KM) || 0.5;
    const isNear = isWithinProximity(
      coordValidation.lat,
      coordValidation.lng,
      stationLat,
      stationLng,
      maxRadiusKm
    );
    
    if (!isNear) {
      // Calculate actual distance for error message
      const { calculateDistance } = require('../utils/geoUtils');
      const actualDistance = calculateDistance(
        coordValidation.lat,
        coordValidation.lng,
        stationLat,
        stationLng
      );
      
      return res.status(403).json({
        success: false,
        message: 'You must be near this station to update fuel availability',
        error: 'PROXIMITY_CHECK_FAILED',
        details: {
          userDistance: `${actualDistance.toFixed(2)} km`,
          maxAllowed: `${maxRadiusKm} km`,
          stationName: station.name
        }
      });
    }
    
    // Attach station to request for use in controller
    req.station = station;
    req.userDistance = maxRadiusKm; // Could store actual distance if needed
    
    next();
    
  } catch (error) {
    console.error('Proximity check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking proximity',
      error: error.message
    });
  }
};

/**
 * Optional proximity check - doesn't block but adds distance info
 * Useful for logging or soft validation
 */
const addDistanceInfo = async (req, res, next) => {
  try {
    const { userLat, userLng } = req.body;
    const { id: stationId } = req.params;
    
    if (userLat === undefined || userLng === undefined) {
      return next(); // Skip if no coords provided
    }
    
    const station = await Station.findById(stationId);
    if (!station) {
      return next();
    }
    
    const stationCoords = station.location?.coordinates;
    if (!stationCoords) {
      return next();
    }
    
    const [stationLng, stationLat] = stationCoords;
    const { calculateDistance } = require('../utils/geoUtils');
    
    try {
      const distance = calculateDistance(
        Number(userLat),
        Number(userLng),
        stationLat,
        stationLng
      );
      req.userDistance = distance;
      req.station = station;
    } catch (e) {
      // Silently continue if distance calculation fails
    }
    
    next();
  } catch (error) {
    // Don't block request on error
    next();
  }
};

module.exports = {
  checkProximity,
  addDistanceInfo
};
