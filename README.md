# Real-Time Ride Booking System with Bidding

A comprehensive ride booking backend system built with Node.js, Express.js, MongoDB, and Socket.IO. Features real-time bidding functionality where customers set maximum prices and drivers bid competitively.

## Features

### Core Functionality
- **User Management**: Registration, profile management
- **Driver Management**: Registration, vehicle details, location tracking
- **Real-Time Bidding**: Drivers bid on rides within customer price limits
- **Live Updates**: Socket.IO for real-time bid updates and notifications
- **Booking Management**: Complete ride lifecycle management
- **Rating System**: Mutual rating system for users and drivers

### Real-Time Features
- Live bid updates during bidding period
- Real-time driver location tracking
- Instant notifications for bid acceptance/rejection
- Live chat between users and drivers
- Driver status updates (online/offline/busy)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Architecture**: MVC Pattern

## Project Structure

```
├── server.js              # Main server file
├── config/
│   └── database.js         # Database configuration
├── models/
│   ├── User.js            # User schema
│   ├── Driver.js          # Driver schema
│   ├── Ride.js            # Ride schema
│   ├── Bid.js             # Bid schema
│   └── Booking.js         # Booking schema
├── controllers/
│   ├── userController.js      # User operations
│   ├── driverController.js    # Driver operations
│   ├── rideController.js      # Ride operations
│   ├── biddingController.js   # Bidding operations
│   └── bookingController.js   # Booking operations
├── routes/
│   ├── userRoutes.js      # User API routes
│   ├── driverRoutes.js    # Driver API routes
│   ├── rideRoutes.js      # Ride API routes
│   └── biddingRoutes.js   # Bidding API routes
└── utils/
    ├── socketEvents.js    # Socket event handlers
    └── priceCalculator.js # Pricing utilities
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ride-booking-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
PORT=6600
MONGODB_URI=mongodb://localhost:27017/ridebooking
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Run the application**
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Drivers
- `POST /api/drivers` - Create driver
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/nearby` - Get nearby drivers
- `GET /api/drivers/:driverId` - Get driver by ID
- `PUT /api/drivers/:driverId/status` - Update driver status

### Rides
- `POST /api/rides` - Create ride
- `GET /api/rides/available` - Get available rides for bidding
- `GET /api/rides/user/:userId` - Get user's rides
- `GET /api/rides/:rideId` - Get ride details
- `PUT /api/rides/:rideId/status` - Update ride status

### Bidding & Bookings
- `POST /api/bidding/place` - Place a bid
- `POST /api/bidding/accept` - Accept a bid
- `GET /api/bidding/ride/:rideId` - Get ride bids
- `GET /api/bidding/driver/:driverId` - Get driver bids
- `GET /api/bidding/bookings` - Get all bookings
- `GET /api/bidding/bookings/user/:userId` - Get user bookings
- `GET /api/bidding/bookings/driver/:driverId` - Get driver bookings
- `PUT /api/bidding/bookings/:bookingId/status` - Update booking status
- `DELETE /api/bidding/bookings/:bookingId` - Cancel booking
- `POST /api/bidding/bookings/:bookingId/rate` - Rate booking

## Socket Events

### Client to Server
- `join-room` - Join a specific room (ride/driver/user)
- `place-bid` - Place a bid on a ride
- `accept-bid` - Accept a specific bid
- `driver-location-update` - Update driver location
- `driver-status-update` - Update driver status

### Server to Client
- `new-ride` - New ride available for bidding
- `new-bid` - New bid placed on a ride
- `bid-updated` - Existing bid updated
- `bid-accepted` - Bid accepted by customer
- `bid-rejected` - Bid rejected
- `ride-status-updated` - Ride status changed
- `booking-status-updated` - Booking status changed
- `driver-location-update` - Driver location updated

## How the Bidding System Works

1. **Customer Creates Ride**: Sets pickup, destination, and maximum price willing to pay
2. **Auto Price Calculation**: System calculates base price using distance and duration
3. **Real-Time Bidding**: Available drivers see the ride and can place competitive bids
4. **Live Updates**: All bids are shown in real-time to the customer
5. **Winning Bid**: Customer can accept any bid within their budget
6. **Booking Creation**: Accepted bid creates a booking and updates all parties
7. **Ride Execution**: Driver and customer can track the ride in real-time

## Database Schema

### User Schema
- Personal information (name, email, phone)
- Avatar selection
- Account status

### Driver Schema
- Personal and professional information
- Vehicle details (model, number, type)
- Location coordinates (GeoJSON)
- Rating and ride statistics
- Online status

### Ride Schema
- Pickup and destination coordinates
- Price information (base, customer max, final)
- Distance and duration
- Bidding timeline
- Status tracking

### Bid Schema
- Bid amount and driver details
- Estimated arrival time
- Optional message to customer
- Winning bid indicator

### Booking Schema
- Final ride details and pricing
- Status tracking throughout ride
- Rating and feedback system
- Payment status

## Real-Time Features Implementation

The system uses Socket.IO for real-time communication:

- **Room Management**: Each ride creates a room for real-time updates
- **Bid Broadcasting**: New bids are instantly broadcast to all room participants
- **Status Updates**: Live status changes for rides, bookings, and driver locations
- **Notifications**: Instant alerts for bid acceptance, cancellations, etc.

## Pricing Algorithm

The system includes intelligent pricing:

- **Base Fare**: Fixed starting amount
- **Distance Rate**: Per kilometer charges
- **Time Rate**: Per minute charges
- **Vehicle Type**: Different rates for sedan, SUV, luxury
- **Surge Pricing**: Dynamic pricing based on demand (future enhancement)

## Usage Examples

### Creating a Ride
```javascript
const rideData = {
  userId: "user_id_here",
  from: {
    address: "Noida Sector 62",
    coordinates: [77.3648, 28.6139]
  },
  to: {
    address: "Delhi Airport T1",
    coordinates: [77.1025, 28.5562]
  },
  distance: 45.5,
  estimatedDuration: 75,
  customerMaxPrice: 800
};
```

### Placing a Bid
```javascript
const bidData = {
  rideId: "ride_id_here",
  driverId: "driver_id_here",
  bidAmount: 650,
  message: "I can reach in 5 minutes",
  estimatedArrival: 5
};
```

## Development

- The server runs on port 6600 by default
- MongoDB connection includes proper error handling and graceful shutdown
- Socket connections are managed with room-based architecture
- All database operations include proper validation and error handling

## Future Enhancements

- Payment gateway integration
- Route optimization
- Driver verification system
- Advanced surge pricing
- Analytics dashboard
- Mobile app push notifications
- Multi-language support