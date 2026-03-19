/**
 * Station Routes
 * Defines API endpoints for station operations
 */

const express = require('express');
const router = express.Router();

// Controller imports
const {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
  getNearbyStations
} = require('../controllers/stationController');

// Validation imports
const {
  validateCreateStation,
  validateGetStation,
  validateStationQuery
} = require('../middleware/validate');

// Route definitions

/**
 * @route   GET /api/stations
 * @desc    Get all stations (optionally filtered by location)
 * @query   lat, lng, radius, search
 */
router.get('/', validateStationQuery, getStations);

/**
 * @route   DELETE /api/stations/all
 * @desc    [ADMIN] Delete all stations — used by import scripts
 */
router.delete('/all', async (req, res) => {
  try {
    const Station = require('../models/Station');
    const result = await Station.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/stations/nearby
 * @desc    Get stations near a specific location
 * @query   lat, lng, radius
 */
router.get('/nearby', getNearbyStations);

/**
 * @route   POST /api/stations
 * @desc    Create a new station
 * @body    { name, address, lat?, lng? }
 */
router.post('/', validateCreateStation, createStation);

/**
 * @route   GET /api/stations/:id
 * @desc    Get a single station by ID
 * @param   id - Station ID
 */
router.get('/:id', validateGetStation, getStation);

/**
 * @route   PUT /api/stations/:id
 * @desc    Update station details
 * @param   id - Station ID
 * @body    { name?, address? }
 */
router.put('/:id', validateGetStation, updateStation);

/**
 * @route   DELETE /api/stations/:id
 * @desc    Delete a station
 * @param   id - Station ID
 */
router.delete('/:id', validateGetStation, deleteStation);

module.exports = router;
