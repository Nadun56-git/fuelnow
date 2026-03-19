/**
 * Station Model - Fuel Station Schema
 * Stores station info and real-time fuel availability
 */

const mongoose = require('mongoose');

const fuelTypeSchema = new mongoose.Schema({
  available: {
    type: Boolean,
    default: null // null = unknown/no updates yet
  },
  lastUpdated: {
    type: Date,
    default: null
  },
  updatedBy: {
    type: String,
    default: null // Could store user ID or session identifier
  }
}, { _id: false });

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true,
    minlength: [3, 'Station name must be at least 3 characters'],
    maxlength: [100, 'Station name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Station address is required'],
    trim: true,
    minlength: [5, 'Address must be at least 5 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON format
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 && // longitude
            coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Expected [longitude, latitude] with valid ranges.'
      }
    }
  },
  fuel: {
    superDiesel: { type: fuelTypeSchema, default: () => ({}) },
    diesel: { type: fuelTypeSchema, default: () => ({}) },
    superPetrol: { type: fuelTypeSchema, default: () => ({}) },
    petrol: { type: fuelTypeSchema, default: () => ({}) }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically manage updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
stationSchema.index({ location: '2dsphere' });

// Index for text search on name and address
stationSchema.index({ name: 'text', address: 'text' });

// Virtual for getting overall availability status
stationSchema.virtual('availabilityStatus').get(function() {
  const fuelTypes = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const statuses = fuelTypes.map(type => this.fuel[type]?.available);
  
  const availableCount = statuses.filter(s => s === true).length;
  const unavailableCount = statuses.filter(s => s === false).length;
  const unknownCount = statuses.filter(s => s === null || s === undefined).length;
  
  if (unknownCount === 4) return 'unknown';
  if (availableCount === 0 && unavailableCount > 0) return 'unavailable';
  if (availableCount > 0 && unavailableCount === 0) return 'available';
  return 'mixed';
});

// Virtual for calculating distance (set by controller)
stationSchema.virtual('distance').get(function() {
  return this._distance;
}).set(function(value) {
  this._distance = value;
});

// Method to update fuel availability
stationSchema.methods.updateFuelAvailability = async function(fuelType, available, updatedBy = null) {
  const validFuelTypes = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  
  if (!validFuelTypes.includes(fuelType)) {
    throw new Error(`Invalid fuel type: ${fuelType}`);
  }
  
  this.fuel[fuelType] = {
    available,
    lastUpdated: new Date(),
    updatedBy
  };
  
  this.updatedAt = new Date();
  await this.save();
  return this;
};

// Static method to find stations near a location
stationSchema.statics.findNearby = async function(lat, lng, radiusKm = 5) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  });
};

// Pre-save middleware to ensure coordinates are valid
stationSchema.pre('save', function(next) {
  if (this.location && this.location.coordinates) {
    const [lng, lat] = this.location.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return next(new Error('Coordinates must be numbers'));
    }
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return next(new Error('Coordinates out of valid range'));
    }
  }
  next();
});

module.exports = mongoose.model('Station', stationSchema);
