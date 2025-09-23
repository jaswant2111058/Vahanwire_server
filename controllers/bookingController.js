const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

const getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email avatar')
      .populate('driverId', 'name phone vehicleDetails rating')
      .populate('rideId', 'from to distance estimatedDuration')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
        id: booking._id,
        user: {
          id: booking.userId._id,
          name: booking.userId.name,
          email: booking.userId.email,
          avatar: booking.userId.avatar
        },
        driver: {
          id: booking.driverId._id,
          name: booking.driverId.name,
          phone: booking.driverId.phone,
          vehicleDetails: booking.driverId.vehicleDetails,
          rating: booking.driverId.rating
        },
        ride: {
          id: booking.rideId._id,
          from: booking.rideId.from,
          to: booking.rideId.to,
          distance: booking.rideId.distance,
          estimatedDuration: booking.rideId.estimatedDuration
        },
        finalAmount: booking.finalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        rating: booking.rating,
        startTime: booking.startTime,
        endTime: booking.endTime,
        createdAt: booking.createdAt
      })),
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('driverId', 'name phone vehicleDetails rating')
      .populate('rideId', 'from to distance estimatedDuration')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
        id: booking._id,
        driver: {
          id: booking.driverId._id,
          name: booking.driverId.name,
          phone: booking.driverId.phone,
          vehicleDetails: booking.driverId.vehicleDetails,
          rating: booking.driverId.rating
        },
        ride: {
          id: booking.rideId._id,
          from: booking.rideId.from,
          to: booking.rideId.to,
          distance: booking.rideId.distance,
          estimatedDuration: booking.rideId.estimatedDuration
        },
        finalAmount: booking.finalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        rating: booking.rating.driverRating,
        feedback: booking.feedback.driverFeedback,
        startTime: booking.startTime,
        endTime: booking.endTime,
        createdAt: booking.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
      error: error.message
    });
  }
};

const getDriverBookings = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.query;

    const filter = { driverId };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email avatar')
      .populate('rideId', 'from to distance estimatedDuration')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings.map(booking => ({
        id: booking._id,
        user: {
          id: booking.userId._id,
          name: booking.userId.name,
          email: booking.userId.email,
          avatar: booking.userId.avatar
        },
        ride: {
          id: booking.rideId._id,
          from: booking.rideId.from,
          to: booking.rideId.to,
          distance: booking.rideId.distance,
          estimatedDuration: booking.rideId.estimatedDuration
        },
        finalAmount: booking.finalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        rating: booking.rating.userRating,
        feedback: booking.feedback.userFeedback,
        startTime: booking.startTime,
        endTime: booking.endTime,
        createdAt: booking.createdAt
      }))
    });
  } catch (error) {
    console.error('Get driver bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver bookings',
      error: error.message
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const updateData = { status };

    if (status === 'in-progress' && !booking.startTime) {
      updateData.startTime = new Date();
      await Ride.findByIdAndUpdate(booking.rideId, { 
        status: 'in-progress',
        rideStartTime: new Date()
      });
    }

    if (status === 'completed' && !booking.endTime) {
      updateData.endTime = new Date();
      await Ride.findByIdAndUpdate(booking.rideId, { 
        status: 'completed',
        rideEndTime: new Date()
      });
      await Driver.findByIdAndUpdate(booking.driverId, { 
        status: 'online',
        $inc: { totalRides: 1 }
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );

    req.io.to(booking.rideId.toString()).emit('booking-status-updated', {
      bookingId: booking._id,
      status: updatedBooking.status,
      startTime: updatedBooking.startTime,
      endTime: updatedBooking.endTime
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: {
        id: updatedBooking._id,
        status: updatedBooking.status,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime
      }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    await Booking.findByIdAndUpdate(bookingId, {
      status: 'cancelled',
      cancellationReason: reason
    });

    await Ride.findByIdAndUpdate(booking.rideId, {
      status: 'cancelled'
    });

    await Driver.findByIdAndUpdate(booking.driverId, {
      status: 'online'
    });

    req.io.to(booking.rideId.toString()).emit('booking-cancelled', {
      bookingId: booking._id,
      reason: reason
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

const rateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, feedback, ratedBy } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }

    const updateData = {};

    if (ratedBy === 'user') {
      updateData['rating.driverRating'] = rating;
      updateData['feedback.driverFeedback'] = feedback;
    } else if (ratedBy === 'driver') {
      updateData['rating.userRating'] = rating;
      updateData['feedback.userFeedback'] = feedback;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid ratedBy value. Must be "user" or "driver"'
      });
    }

    await Booking.findByIdAndUpdate(bookingId, updateData);

    if (ratedBy === 'user') {
      const driverBookings = await Booking.find({
        driverId: booking.driverId,
        'rating.driverRating': { $exists: true, $ne: null }
      });

      const avgRating = driverBookings.reduce((sum, b) => sum + b.rating.driverRating, 0) / driverBookings.length;
      
      await Driver.findByIdAndUpdate(booking.driverId, {
        rating: Math.round(avgRating * 10) / 10
      });
    }

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting rating',
      error: error.message
    });
  }
};

module.exports = {
  getAllBookings,
  getUserBookings,
  getDriverBookings,
  updateBookingStatus,
  cancelBooking,
  rateBooking
};