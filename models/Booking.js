const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: [true, 'Ride ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersVahan',
    required: [true, 'User ID is required']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriversVahan',
    required: [true, 'Driver ID is required']
  },
  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    required: [true, 'Bid ID is required']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  rating: {
    driverRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },
  feedback: {
    driverFeedback: {
      type: String,
      maxLength: [500, 'Feedback cannot exceed 500 characters'],
      default: null
    },
    userFeedback: {
      type: String,
      maxLength: [500, 'Feedback cannot exceed 500 characters'],
      default: null
    }
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Booking', bookingSchema);