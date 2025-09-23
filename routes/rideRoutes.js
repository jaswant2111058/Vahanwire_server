const express = require('express');
const router = express.Router();
const {
  createRide,
  getAvailableRides,
  getRideById,
  updateRideStatus,
  getUserRides
} = require('../controllers/rideController');

router.post('/', createRide);
router.get('/available', getAvailableRides);
router.get('/user/:userId', getUserRides);
router.get('/:rideId', getRideById);
router.put('/:rideId/status', updateRideStatus);

module.exports = router;