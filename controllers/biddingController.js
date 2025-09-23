const Bid = require('../models/Bid');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

const placeBid = async (req, res) => {
  try {
    const { rideId, driverId, bidAmount, message, estimatedArrival } = req.body;

    const ride = await Ride.findById(rideId).populate('userId', 'name avatar');
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        message: 'Bidding is not active for this ride'
      });
    }

    if (new Date() > ride.biddingEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Bidding time has expired'
      });
    }

    if (bidAmount > ride.customerMaxPrice) {
      return res.status(400).json({
        success: false,
        message: 'Bid amount exceeds customer maximum price'
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver || !driver.isActive || driver.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Driver not available for bidding'
      });
    }

    const existingBid = await Bid.findOne({ rideId, driverId });
    if (existingBid) {
      existingBid.bidAmount = bidAmount;
      existingBid.message = message;
      existingBid.estimatedArrival = estimatedArrival;
      await existingBid.save();
      await existingBid.populate('driverId', 'name vehicleDetails rating');

      await updateWinningBid(rideId);

      req.io.to(rideId.toString()).emit('bid-updated', {
        bidId: existingBid._id,
        rideId: rideId,
        driverId: driverId,
        driverName: existingBid.driverId.name,
        vehicleDetails: existingBid.driverId.vehicleDetails,
        rating: existingBid.driverId.rating,
        bidAmount: existingBid.bidAmount,
        message: existingBid.message,
        estimatedArrival: existingBid.estimatedArrival,
        isWinning: existingBid.isWinning
      });

      return res.json({
        success: true,
        message: 'Bid updated successfully',
        bid: {
          id: existingBid._id,
          bidAmount: existingBid.bidAmount,
          message: existingBid.message,
          estimatedArrival: existingBid.estimatedArrival,
          isWinning: existingBid.isWinning
        }
      });
    }

    const bid = new Bid({
      rideId,
      driverId,
      bidAmount,
      message,
      estimatedArrival
    });

    await bid.save();
    await bid.populate('driverId', 'name vehicleDetails rating');

    await updateWinningBid(rideId);
    await bid.populate('driverId', 'name vehicleDetails rating');

    req.io.to(rideId.toString()).emit('new-bid', {
      bidId: bid._id,
      rideId: rideId,
      driverId: driverId,
      driverName: bid.driverId.name,
      vehicleDetails: bid.driverId.vehicleDetails,
      rating: bid.driverId.rating,
      bidAmount: bid.bidAmount,
      message: bid.message,
      estimatedArrival: bid.estimatedArrival,
      isWinning: bid.isWinning,
      userName: ride.userId.name,
      userAvatar: ride.userId.avatar
    });

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      bid: {
        id: bid._id,
        bidAmount: bid.bidAmount,
        message: bid.message,
        estimatedArrival: bid.estimatedArrival,
        isWinning: bid.isWinning
      }
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing bid',
      error: error.message
    });
  }
};

const updateWinningBid = async (rideId) => {
  try {
    await Bid.updateMany({ rideId }, { isWinning: false });

    const lowestBid = await Bid.findOne({
      rideId,
      status: 'active'
    }).sort({ bidAmount: 1 });

    if (lowestBid) {
      lowestBid.isWinning = true;
      await lowestBid.save();
    }
  } catch (error) {
    console.error('Update winning bid error:', error);
  }
};

const acceptBid = async (req, res) => {
  try {
    const { bidId, userId } = req.body;

    const bid = await Bid.findById(bidId)
      .populate('rideId')
      .populate('driverId', 'name phone vehicleDetails rating');

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    if (bid.rideId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to accept this bid'
      });
    }

    if (bid.rideId.status !== 'bidding') {
      return res.status(400).json({
        success: false,
        message: 'Ride is not in bidding state'
      });
    }

    bid.status = 'accepted';
    await bid.save();

    await Bid.updateMany(
      { rideId: bid.rideId._id, _id: { $ne: bidId } },
      { status: 'rejected' }
    );

    const ride = await Ride.findByIdAndUpdate(
      bid.rideId._id,
      {
        status: 'accepted',
        acceptedDriver: bid.driverId._id,
        finalPrice: bid.bidAmount
      },
      { new: true }
    );

    await Driver.findByIdAndUpdate(
      bid.driverId._id,
      { status: 'busy' }
    );

    const booking = new Booking({
      rideId: ride._id,
      userId: ride.userId,
      driverId: bid.driverId._id,
      bidId: bid._id,
      finalAmount: bid.bidAmount
    });

    await booking.save();

    req.io.to(bid.rideId._id.toString()).emit('bid-accepted', {
      rideId: bid.rideId._id,
      bidId: bid._id,
      driverId: bid.driverId._id,
      driverName: bid.driverId.name,
      driverPhone: bid.driverId.phone,
      vehicleDetails: bid.driverId.vehicleDetails,
      finalAmount: bid.bidAmount,
      bookingId: booking._id
    });

    req.io.emit('ride-completed', {
      rideId: bid.rideId._id
    });

    res.json({
      success: true,
      message: 'Bid accepted successfully',
      booking: {
        id: booking._id,
        rideId: ride._id,
        driverId: bid.driverId._id,
        driverName: bid.driverId.name,
        driverPhone: bid.driverId.phone,
        vehicleDetails: bid.driverId.vehicleDetails,
        finalAmount: bid.bidAmount,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting bid',
      error: error.message
    });
  }
};

const getRideBids = async (req, res) => {
  try {
    const { rideId } = req.params;

    const bids = await Bid.find({ rideId })
      .populate('driverId', 'name vehicleDetails rating')
      .sort({ bidAmount: 1 });

    res.json({
      success: true,
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
    });
  } catch (error) {
    console.error('Get ride bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ride bids',
      error: error.message
    });
  }
};

const getDriverBids = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.query;

    const filter = { driverId };
    if (status) filter.status = status;

    const bids = await Bid.find(filter)
      .populate({
        path: 'rideId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bids: bids.map(bid => ({
        id: bid._id,
        rideId: bid.rideId._id,
        userId: bid.rideId.userId._id,
        userName: bid.rideId.userId.name,
        userAvatar: bid.rideId.userId.avatar,
        from: bid.rideId.from,
        to: bid.rideId.to,
        bidAmount: bid.bidAmount,
        message: bid.message,
        estimatedArrival: bid.estimatedArrival,
        status: bid.status,
        isWinning: bid.isWinning,
        createdAt: bid.createdAt
      }))
    });
  } catch (error) {
    console.error('Get driver bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver bids',
      error: error.message
    });
  }
};

module.exports = {
  placeBid,
  acceptBid,
  getRideBids,
  getDriverBids
};