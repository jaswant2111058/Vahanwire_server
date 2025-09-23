const express = require('express');
const router = express.Router();
const {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriverStatus,
  getNearbyDrivers
} = require('../controllers/driverController');

router.post('/', createDriver);
router.get('/', getDrivers);
router.get('/nearby', getNearbyDrivers);
router.get('/:driverId', getDriverById);
router.put('/:driverId/status', updateDriverStatus);

module.exports = router;