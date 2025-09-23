const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersVahan',
    required: [true, 'User ID is required']
  },
  from: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    coordinates: {
      type: [Number],
      required: [true, 'Pickup coordinates are required']
    }
  },
  to: {
    address: {
      type: String,
      required: [true, 'Destination address is required']
    },
    coordinates: {
      type: [Number],
      required: [true, 'Destination coordinates are required']
    }
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  customerMaxPrice: {
    type: Number,
    required: [true, 'Customer maximum price is required'],
    min: [0, 'Price cannot be negative']
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [0, 'Distance cannot be negative']
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'bidding', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledTime: {
    type: Date,
    default: Date.now
  },
  acceptedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriversVahan',
    default: null
  },
  finalPrice: {
    type: Number,
    default: null
  },
  biddingEndTime: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000)
  },
  rideStartTime: {
    type: Date,
    default: null
  },
  rideEndTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});



module.exports = mongoose.model('Ride', rideSchema);