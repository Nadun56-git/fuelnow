/**
 * Fuel Controller
 * Handles fuel availability updates and real-time notifications
 */

const Station = require('../models/Station');
const FuelUpdate = require('../models/FuelUpdate');

/**
 * @desc    Update fuel availability for a station
 * @route   PATCH /api/stations/:id/fuel
 */
const updateFuelAvailability = async (req, res) => {
  try {
    const { id: stationId } = req.params;
    const { fuelType, available, userLat, userLng } = req.body;
    const io = req.app.get('io');
    
    // Station is attached by geoCheck middleware
    const station = req.station;
    
    // Update the fuel availability
    await station.updateFuelAvailability(fuelType, available, req.ip || 'anonymous');
    
    // Log the update
    await FuelUpdate.create({
      stationId,
      fuelType,
      available,
      userCoords: {
        lat: parseFloat(userLat),
        lng: parseFloat(userLng)
      },
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    // Emit real-time update to all connected clients
    if (io) {
      io.emit('fuelUpdated', {
        stationId: station._id.toString(),
        stationName: station.name,
        fuelType,
        available,
        lastUpdated: station.fuel[fuelType].lastUpdated
      });
    }
    
    res.status(200).json({
      success: true,
      message: `${formatFuelType(fuelType)} availability updated successfully`,
      data: {
        stationId: station._id,
        fuelType,
        available,
        lastUpdated: station.fuel[fuelType].lastUpdated
      }
    });
    
  } catch (error) {
    console.error('Error updating fuel availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fuel availability',
      error: error.message
    });
  }
};

/**
 * @desc    Batch update fuel availability (multiple types at once)
 * @route   PATCH /api/stations/:id/fuel/batch
 */
const batchUpdateFuelAvailability = async (req, res) => {
  try {
    const { id: stationId } = req.params;
    const { updates, userLat, userLng } = req.body;
    const io = req.app.get('io');
    
    // Station is attached by geoCheck middleware
    const station = req.station;
    
    const results = [];
    
    // Process each update
    for (const update of updates) {
      const { fuelType, available } = update;
      
      // Update station
      await station.updateFuelAvailability(fuelType, available, req.ip || 'anonymous');
      
      // Log update
      await FuelUpdate.create({
        stationId,
        fuelType,
        available,
        userCoords: {
          lat: parseFloat(userLat),
          lng: parseFloat(userLng)
        },
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      
      results.push({
        fuelType,
        available,
        lastUpdated: station.fuel[fuelType].lastUpdated
      });
      
      // Emit real-time update
      if (io) {
        io.emit('fuelUpdated', {
          stationId: station._id.toString(),
          stationName: station.name,
          fuelType,
          available,
          lastUpdated: station.fuel[fuelType].lastUpdated
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `${results.length} fuel type(s) updated successfully`,
      data: {
        stationId: station._id,
        updates: results
      }
    });
    
  } catch (error) {
    console.error('Error batch updating fuel availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fuel availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get fuel update history for a station
 * @route   GET /api/stations/:id/fuel/history
 */
const getFuelHistory = async (req, res) => {
  try {
    const { id: stationId } = req.params;
    const { limit = 20, fuelType } = req.query;
    
    // Verify station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    // Build query
    let query = { stationId };
    if (fuelType) {
      query.fuelType = fuelType;
    }
    
    const history = await FuelUpdate.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
    
  } catch (error) {
    console.error('Error fetching fuel history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fuel history',
      error: error.message
    });
  }
};

/**
 * @desc    Get fuel statistics for a station
 * @route   GET /api/stations/:id/fuel/stats
 */
const getFuelStats = async (req, res) => {
  try {
    const { id: stationId } = req.params;
    const { hours = 24 } = req.query;
    
    // Verify station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    const stats = await FuelUpdate.getStats(stationId, parseInt(hours));
    
    res.status(200).json({
      success: true,
      data: {
        stationId,
        period: `${hours} hours`,
        stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching fuel stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fuel statistics',
      error: error.message
    });
  }
};

/**
 * Helper function to format fuel type for display
 */
const formatFuelType = (fuelType) => {
  const formats = {
    superDiesel: 'Super Diesel',
    diesel: 'Diesel',
    superPetrol: 'Super Petrol',
    petrol: 'Petrol'
  };
  return formats[fuelType] || fuelType;
};

module.exports = {
  updateFuelAvailability,
  batchUpdateFuelAvailability,
  getFuelHistory,
  getFuelStats
};
