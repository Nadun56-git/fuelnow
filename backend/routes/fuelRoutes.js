/**
 * Fuel Routes
 * Defines API endpoints for fuel availability operations
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params to access :id from parent route

// Controller imports
const {
  updateFuelAvailability,
  batchUpdateFuelAvailability,
  getFuelHistory,
  getFuelStats
} = require('../controllers/fuelController');

// Middleware imports
const { checkProximity } = require('../middleware/geoCheck');
const {
  validateFuelUpdate,
  validateBatchFuelUpdate,
  validateGetStation
} = require('../middleware/validate');

/**
 * @route   PATCH /api/stations/:id/fuel
 * @desc    Update fuel availability for a station
 * @param   id - Station ID
 * @body    { fuelType, available, userLat, userLng }
 * @access  Requires user to be within 500m of station
 */
router.patch(
  '/:id/fuel',
  validateFuelUpdate,
  checkProximity,
  updateFuelAvailability
);

/**
 * @route   PATCH /api/stations/:id/fuel/batch
 * @desc    Batch update multiple fuel types
 * @param   id - Station ID
 * @body    { updates: [{ fuelType, available }], userLat, userLng }
 * @access  Requires user to be within 500m of station
 */
router.patch(
  '/:id/fuel/batch',
  validateBatchFuelUpdate,
  checkProximity,
  batchUpdateFuelAvailability
);

/**
 * @route   GET /api/stations/:id/fuel/history
 * @desc    Get fuel update history for a station
 * @param   id - Station ID
 * @query   limit, fuelType
 */
router.get('/:id/fuel/history', validateGetStation, getFuelHistory);

/**
 * @route   GET /api/stations/:id/fuel/stats
 * @desc    Get fuel update statistics for a station
 * @param   id - Station ID
 * @query   hours
 */
router.get('/:id/fuel/stats', validateGetStation, getFuelStats);

module.exports = router;
