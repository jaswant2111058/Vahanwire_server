const express = require('express');
const router = express.Router();
const {
  placeBid,
  acceptBid,
  getRideBids,
  getDriverBids
} = require('../controllers/biddingController');

const {
  getAllBookings,
  getUserBookings,
  getDriverBookings,
  updateBookingStatus,
  cancelBooking,
  rateBooking
} = require('../controllers/bookingController');

router.post('/place', placeBid);
router.post('/accept', acceptBid);
router.get('/ride/:rideId', getRideBids);
router.get('/driver/:driverId', getDriverBids);

router.get('/bookings', getAllBookings);
router.get('/bookings/user/:userId', getUserBookings);
router.get('/bookings/driver/:driverId', getDriverBookings);
router.put('/bookings/:bookingId/status', updateBookingStatus);
router.delete('/bookings/:bookingId', cancelBooking);
router.post('/bookings/:bookingId/rate', rateBooking);

module.exports = router;