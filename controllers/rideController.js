const Ride = require('../models/Ride');
const User = require('../models/User');
const Driver = require('../models/Driver');

const calculateBasePrice = (distance, duration) => {
  const baseFare = 50;
  const perKmRate = 12;
  const perMinuteRate = 2;
  
  return Math.round(baseFare + (distance * perKmRate) + (duration * perMinuteRate));
};

const createRide = async (req, res) => {
  try {
    const { userId, from, to, distance, estimatedDuration, customerMaxPrice } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const basePrice = calculateBasePrice(distance, estimatedDuration);

    const ride = new Ride({
      userId,
      from,
      to,
      basePrice,
      customerMaxPrice: customerMaxPrice || basePrice * 1.5,
      distance,
      estimatedDuration,
      status: 'bidding',
      biddingEndTime: new Date(Date.now() + 10 * 60 * 1000)
    });

    await ride.save();
    await ride.populate('userId', 'name email avatar');

    req.io.emit('new-ride', {
      rideId: ride._id,
      userId: ride.userId._id,
      userName: ride.userId.name,
      userAvatar: ride.userId.avatar,
      from: ride.from,
      to: ride.to,
      basePrice: ride.basePrice,
      customerMaxPrice: ride.customerMaxPrice,
      distance: ride.distance,
      estimatedDuration: ride.estimatedDuration,
      biddingEndTime: ride.biddingEndTime
    });

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      ride: {
        id: ride._id,
        userId: ride.userId._id,
        userName: ride.userId.name,
        userAvatar: ride.userId.avatar,
        from: ride.from,
        to: ride.to,
        basePrice: ride.basePrice,
        customerMaxPrice: ride.customerMaxPrice,
        distance: ride.distance,
        estimatedDuration: ride.estimatedDuration,
        status: ride.status,
        biddingEndTime: ride.biddingEndTime
      }
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ride',
      error: error.message
    });
  }
};

const getAvailableRides = async (req, res) => {
  try {
    const { driverId } = req.query;

    const rides = await Ride.find({
      status: 'bidding',
      biddingEndTime: { $gt: new Date() }
    })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 });

    const ridesWithBidStatus = await Promise.all(
      rides.map(async (ride) => {
        let hasBid = false;
        if (driverId) {
          const existingBid = await require('../models/Bid').findOne({
            rideId: ride._id,
            driverId: driverId
          });
          hasBid = !!existingBid;
        }

        return {
          id: ride._id,
          userId: ride.userId._id,
          userName: ride.userId.name,
          userAvatar: ride.userId.avatar,
          from: ride.from,
          to: ride.to,
          basePrice: ride.basePrice,
          customerMaxPrice: ride.customerMaxPrice,
          distance: ride.distance,
          estimatedDuration: ride.estimatedDuration,
          status: ride.status,
          biddingEndTime: ride.biddingEndTime,
          hasBid: hasBid
        };
      })
    );

    res.json({
      success: true,
      rides: ridesWithBidStatus
    });
  } catch (error) {
    console.error('Get available rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available rides',
      error: error.message
    });
  }
};

const getRideById = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId)
      .populate('userId', 'name email avatar')
      .populate('acceptedDriver', 'name phone vehicleDetails rating');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const bids = await require('../models/Bid').find({ rideId: ride._id })
      .populate('driverId', 'name vehicleDetails rating')
      .sort({ bidAmount: 1 });

    res.json({
      success: true,
      ride: {
        id: ride._id,
        userId: ride.userId._id,
        userName: ride.userId.name,
        userAvatar: ride.userId.avatar,
        from: ride.from,
        to: ride.to,
        basePrice: ride.basePrice,
        customerMaxPrice: ride.customerMaxPrice,
        distance: ride.distance,
        estimatedDuration: ride.estimatedDuration,
        status: ride.status,
        biddingEndTime: ride.biddingEndTime,
        acceptedDriver: ride.acceptedDriver,
        finalPrice: ride.finalPrice,
        bids: bids.map(bid => ({
          id: bid._id,
          driverId: bid.driverId._id,
          driverName: bid.driverId.name,
          vehicleDetails: bid.driverId.vehicleDetails,
          rating: bid.driverId.rating,
          bidAmount: bid.bidAmount,
          message: bid.message,
          estimatedArrival: bid.estimatedArrival,
          status: bid.status,
          isWinning: bid.isWinning,
          createdAt: bid.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ride',
      error: error.message
    });
  }
};

const updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;

    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatar');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    req.io.to(rideId).emit('ride-status-updated', {
      rideId: ride._id,
      status: ride.status
    });

    res.json({
      success: true,
      message: 'Ride status updated successfully',
      ride: {
        id: ride._id,
        status: ride.status
      }
    });
  } catch (error) {
    console.error('Update ride status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ride status',
      error: error.message
    });
  }
};

const getUserRides = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const rides = await Ride.find(filter)
      .populate('acceptedDriver', 'name phone vehicleDetails rating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rides: rides.map(ride => ({
        id: ride._id,
        from: ride.from,
        to: ride.to,
        basePrice: ride.basePrice,
        finalPrice: ride.finalPrice,
        distance: ride.distance,
        estimatedDuration: ride.estimatedDuration,
        status: ride.status,
        acceptedDriver: ride.acceptedDriver,
        createdAt: ride.createdAt,
        rideStartTime: ride.rideStartTime,
        rideEndTime: ride.rideEndTime
      }))
    });
  } catch (error) {
    console.error('Get user rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user rides',
      error: error.message
    });
  }
};

module.exports = {
  createRide,
  getAvailableRides,
  getRideById,
  updateRideStatus,
  getUserRides
};