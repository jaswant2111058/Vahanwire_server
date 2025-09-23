const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    lowercase: true,
  },
  phone: {
    type: String,
  },
  licenseNumber: {
    type: String,
    trim: true,
    default: 'UNKNOWN'
  },
  vehicleDetails: {
    model: {
      type: String,
      default: 'Unknown'
    },
    number: {
      type: String,
      uppercase: true,
      default: 'UNKNOWN'
    },
    type: {
      type: String,
      enum: ['sedan', 'hatchback', 'suv', 'luxury'],
      default: 'sedan'
    }
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalRides: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy'],
    default: 'offline'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('DriversVahan', driverSchema);