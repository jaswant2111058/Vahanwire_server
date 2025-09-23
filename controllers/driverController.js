const Driver = require('../models/Driver');

const createDriver = async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, vehicleDetails } = req.body;

    const driver = new Driver({
      name,
      email,
      phone,
      licenseNumber,
      vehicleDetails
    });

    await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        vehicleDetails: driver.vehicleDetails,
        rating: driver.rating,
        status: driver.status
      }
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating driver',
      error: error.message
    });
  }
};

const getDrivers = async (req, res) => {
  try {
    const { status, isActive } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const drivers = await Driver.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      drivers: drivers.map(driver => ({
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        vehicleDetails: driver.vehicleDetails,
        rating: driver.rating,
        totalRides: driver.totalRides,
        status: driver.status,
        location: driver.location
      }))
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching drivers',
      error: error.message
    });
  }
};

const getDriverById = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId).select('-__v');

    if (!driver || !driver.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        vehicleDetails: driver.vehicleDetails,
        rating: driver.rating,
        totalRides: driver.totalRides,
        status: driver.status,
        location: driver.location
      }
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver',
      error: error.message
    });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, location } = req.body;

    const updateData = { status };
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver status updated successfully',
      driver: {
        id: driver._id,
        name: driver.name,
        status: driver.status,
        location: driver.location
      }
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating driver status',
      error: error.message
    });
  }
};

const getNearbyDrivers = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const drivers = await Driver.find({
      status: 'online',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).select('name vehicleDetails rating location status');

    res.json({
      success: true,
      drivers: drivers.map(driver => ({
        id: driver._id,
        name: driver.name,
        vehicleDetails: driver.vehicleDetails,
        rating: driver.rating,
        location: driver.location,
        status: driver.status
      }))
    });
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby drivers',
      error: error.message
    });
  }
};

module.exports = {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriverStatus,
  getNearbyDrivers
};