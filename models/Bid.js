const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: [true, 'Ride ID is required']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriversVahan',
    required: [true, 'Driver ID is required']
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
  },
  message: {
    type: String,
    maxLength: [200, 'Message cannot exceed 200 characters'],
    trim: true
  },
  estimatedArrival: {
    type: Number,
    required: [true, 'Estimated arrival time is required'],
    min: [0, 'Arrival time cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'accepted', 'rejected', 'expired'],
    default: 'active'
  },
  isWinning: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('Bid', bidSchema);