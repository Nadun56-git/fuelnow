/**
 * FuelUpdate Model - Update Log Schema
 * Tracks all fuel availability updates for audit and analytics
 */

const mongoose = require('mongoose');

const fuelUpdateSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'Station ID is required'],
    index: true
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: {
      values: ['superDiesel', 'diesel', 'superPetrol', 'petrol'],
      message: 'Fuel type must be one of: superDiesel, diesel, superPetrol, petrol'
    },
    index: true
  },
  available: {
    type: Boolean,
    required: [true, 'Availability status is required']
  },
  userCoords: {
    lat: {
      type: Number,
      required: [true, 'User latitude is required'],
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90']
    },
    lng: {
      type: Number,
      required: [true, 'User longitude is required'],
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180']
    }
  },
  userId: {
    type: String,
    default: null // Anonymous updates allowed, or store session/user ID
  },
  userAgent: {
    type: String,
    default: null // For tracking/anti-spam
  },
  ipAddress: {
    type: String,
    default: null // For rate limiting
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We use our own timestamp field
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient querying
fuelUpdateSchema.index({ stationId: 1, timestamp: -1 });
fuelUpdateSchema.index({ fuelType: 1, timestamp: -1 });

// Virtual for time elapsed since update
fuelUpdateSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
});

// Static method to get recent updates for a station
fuelUpdateSchema.statics.getRecentForStation = async function(stationId, limit = 10) {
  return this.find({ stationId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('stationId', 'name address');
};

// Static method to get update statistics
fuelUpdateSchema.statics.getStats = async function(stationId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { stationId: new mongoose.Types.ObjectId(stationId), timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$fuelType',
        totalUpdates: { $sum: 1 },
        availableCount: { $sum: { $cond: ['$available', 1, 0] } },
        unavailableCount: { $sum: { $cond: ['$available', 0, 1] } },
        lastUpdate: { $max: '$timestamp' }
      }
    }
  ]);
};

module.exports = mongoose.model('FuelUpdate', fuelUpdateSchema);
