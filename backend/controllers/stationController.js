/**
 * Station Controller
 * Handles CRUD operations for fuel stations
 */

const Station = require('../models/Station');
const axios = require('axios');
const { sortStationsByDistance, validateCoordinates } = require('../utils/geoUtils');

/**
 * @desc    Get all stations
 * @route   GET /api/stations
 * @query   lat, lng, radius - for location-based filtering
 */
const getStations = async (req, res) => {
  try {
    const { lat, lng, radius = 5, search } = req.query;
    
    let query = {};
    let stations;
    
    // If coordinates provided, use geospatial query
    if (lat && lng) {
      const coordValidation = validateCoordinates(lat, lng);
      if (!coordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: coordValidation.error
        });
      }
      
      const radiusMeters = parseFloat(radius) * 1000;
      
      stations = await Station.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [coordValidation.lng, coordValidation.lat]
            },
            $maxDistance: radiusMeters
          }
        }
      }).lean();
      
      // Calculate distances for response
      stations = stations.map(station => {
        const stationLat = station.location.coordinates[1];
        const stationLng = station.location.coordinates[0];
        const { calculateDistance } = require('../utils/geoUtils');
        const distance = calculateDistance(
          coordValidation.lat,
          coordValidation.lng,
          stationLat,
          stationLng
        );
        return { ...station, distance };
      });
      
    } else if (search) {
      // Text search on name and address
      stations = await Station.find(
        { $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .lean();
    } else {
      // Get all stations
      stations = await Station.find().lean();
    }
    
    res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
    
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stations',
      error: error.message
    });
  }
};

/**
 * @desc    Get single station by ID
 * @route   GET /api/stations/:id
 */
const getStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;
    
    const station = await Station.findById(id).lean();
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    // Calculate distance if user coordinates provided
    if (lat && lng) {
      const coordValidation = validateCoordinates(lat, lng);
      if (coordValidation.valid) {
        const { calculateDistance } = require('../utils/geoUtils');
        const stationLat = station.location.coordinates[1];
        const stationLng = station.location.coordinates[0];
        station.distance = calculateDistance(
          coordValidation.lat,
          coordValidation.lng,
          stationLat,
          stationLng
        );
      }
    }
    
    res.status(200).json({
      success: true,
      data: station
    });
    
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching station',
      error: error.message
    });
  }
};

/**
 * @desc    Create new station
 * @route   POST /api/stations
 */
const createStation = async (req, res) => {
  try {
    const { name, address, lat, lng } = req.body;
    
    let coordinates;
    let formattedAddress = address;
    
    // If coordinates provided, use them
    if (lat !== undefined && lng !== undefined) {
      coordinates = [parseFloat(lng), parseFloat(lat)];
    } else {
      // Geocode address using Nominatim
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        
        const response = await axios.get(nominatimUrl, {
          headers: {
            'User-Agent': 'FuelNow/1.0 (fuelnow@example.com)'
          },
          timeout: 5000
        });
        
        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          coordinates = [parseFloat(result.lon), parseFloat(result.lat)];
          formattedAddress = result.display_name || address;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Could not geocode address. Please provide valid coordinates.',
            error: 'GEOCODING_FAILED'
          });
        }
      } catch (geoError) {
        console.error('Geocoding error:', geoError.message);
        return res.status(503).json({
          success: false,
          message: 'Address lookup service unavailable. Please provide coordinates manually.',
          error: 'GEOCODING_SERVICE_ERROR'
        });
      }
    }
    
    // Create station
    const station = await Station.create({
      name,
      address: formattedAddress,
      location: {
        type: 'Point',
        coordinates
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: station
    });
    
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating station',
      error: error.message
    });
  }
};

/**
 * @desc    Update station details
 * @route   PUT /api/stations/:id
 */
const updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    
    const station = await Station.findById(id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    // Update fields
    if (name) station.name = name;
    if (address) station.address = address;
    
    await station.save();
    
    res.status(200).json({
      success: true,
      message: 'Station updated successfully',
      data: station
    });
    
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating station',
      error: error.message
    });
  }
};

/**
 * @desc    Delete station
 * @route   DELETE /api/stations/:id
 */
const deleteStation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const station = await Station.findById(id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    await station.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Station deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting station',
      error: error.message
    });
  }
};

/**
 * @desc    Get nearby stations
 * @route   GET /api/stations/nearby
 */
const getNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const coordValidation = validateCoordinates(lat, lng);
    if (!coordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: coordValidation.error
      });
    }
    
    const radiusMeters = parseFloat(radius) * 1000;
    
    const stations = await Station.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [coordValidation.lng, coordValidation.lat]
          },
          $maxDistance: radiusMeters
        }
      }
    }).lean();
    
    // Add distance to each station
    const { calculateDistance } = require('../utils/geoUtils');
    const stationsWithDistance = stations.map(station => {
      const stationLat = station.location.coordinates[1];
      const stationLng = station.location.coordinates[0];
      const distance = calculateDistance(
        coordValidation.lat,
        coordValidation.lng,
        stationLat,
        stationLng
      );
      return { ...station, distance };
    });
    
    res.status(200).json({
      success: true,
      count: stationsWithDistance.length,
      data: stationsWithDistance
    });
    
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby stations',
      error: error.message
    });
  }
};

module.exports = {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
  getNearbyStations
};
