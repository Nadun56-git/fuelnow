/**
 * Input Validation Middleware
 * Uses express-validator for request validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Format validation errors for response
 */
const formatErrors = (errors) => {
  return errors.array().map(err => ({
    field: err.path,
    message: err.msg,
    value: err.value
  }));
};

/**
 * Middleware to handle validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatErrors(errors)
    });
  }
  next();
};

// Validation rules for creating a station
const validateCreateStation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Station name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters')
    .escape(),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Station address is required')
    .isLength({ min: 5 }).withMessage('Address must be at least 5 characters')
    .escape(),
  
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  // If lat is provided, lng must be provided and vice versa
  body().custom((value, { req }) => {
    const hasLat = req.body.lat !== undefined;
    const hasLng = req.body.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new Error('Both lat and lng must be provided together, or neither');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation rules for updating fuel availability
const validateFuelUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid station ID format'),
  
  body('fuelType')
    .notEmpty().withMessage('Fuel type is required')
    .isIn(['superDiesel', 'diesel', 'superPetrol', 'petrol'])
    .withMessage('Fuel type must be one of: superDiesel, diesel, superPetrol, petrol'),
  
  body('available')
    .notEmpty().withMessage('Availability status is required')
    .isBoolean().withMessage('Available must be a boolean (true or false)'),
  
  body('userLat')
    .notEmpty().withMessage('User latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('User latitude must be between -90 and 90'),
  
  body('userLng')
    .notEmpty().withMessage('User longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('User longitude must be between -180 and 180'),
  
  handleValidationErrors
];

// Validation rules for getting station by ID
const validateGetStation = [
  param('id')
    .isMongoId().withMessage('Invalid station ID format'),
  handleValidationErrors
];

// Validation rules for querying stations with location
const validateStationQuery = [
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km'),
  
  // If lat is provided, lng must be provided and vice versa
  query().custom((value, { req }) => {
    const hasLat = req.query.lat !== undefined;
    const hasLng = req.query.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new Error('Both lat and lng query params must be provided together, or neither');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation for batch fuel update (multiple fuel types at once)
const validateBatchFuelUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid station ID format'),
  
  body('updates')
    .isArray({ min: 1 }).withMessage('Updates must be a non-empty array'),
  
  body('updates.*.fuelType')
    .notEmpty().withMessage('Each update must have a fuelType')
    .isIn(['superDiesel', 'diesel', 'superPetrol', 'petrol'])
    .withMessage('Invalid fuel type in updates array'),
  
  body('updates.*.available')
    .isBoolean().withMessage('Each update must have a boolean available value'),
  
  body('userLat')
    .notEmpty().withMessage('User latitude is required')
    .isFloat({ min: -90, max: 90 }),
  
  body('userLng')
    .notEmpty().withMessage('User longitude is required')
    .isFloat({ min: -180, max: 180 }),
  
  handleValidationErrors
];

module.exports = {
  validateCreateStation,
  validateFuelUpdate,
  validateGetStation,
  validateStationQuery,
  validateBatchFuelUpdate,
  handleValidationErrors
};
