const socketEvents = {
  connection: 'connection',
  disconnect: 'disconnect',
  
  joinRoom: 'join-room',
  leaveRoom: 'leave-room',
  
  newRide: 'new-ride',
  rideStatusUpdated: 'ride-status-updated',
  rideCompleted: 'ride-completed',
  
  placeBid: 'place-bid',
  newBid: 'new-bid',
  bidUpdated: 'bid-updated',
  acceptBid: 'accept-bid',
  bidAccepted: 'bid-accepted',
  bidRejected: 'bid-rejected',
  
  bookingStatusUpdated: 'booking-status-updated',
  bookingCancelled: 'booking-cancelled',
  
  driverLocationUpdate: 'driver-location-update',
  driverStatusUpdate: 'driver-status-update',
  
  userConnected: 'user-connected',
  userDisconnected: 'user-disconnected',
  driverConnected: 'driver-connected',
  driverDisconnected: 'driver-disconnected'
};

const handleSocketConnection = (io) => {
  io.on(socketEvents.connection, (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on(socketEvents.joinRoom, (data) => {
      const { roomId, userType, userId } = data;
      socket.join(roomId);
      socket.userId = userId;
      socket.userType = userType;
      
      console.log(`${userType} ${userId} joined room ${roomId}`);
      
      socket.to(roomId).emit(`${userType}-connected`, {
        userId: userId,
        socketId: socket.id
      });
    });

    socket.on(socketEvents.leaveRoom, (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    socket.on(socketEvents.driverLocationUpdate, (data) => {
      const { driverId, location, rideId } = data;
      
      if (rideId) {
        socket.to(rideId).emit(socketEvents.driverLocationUpdate, {
          driverId,
          location,
          timestamp: new Date()
        });
      }
    });

    socket.on(socketEvents.driverStatusUpdate, (data) => {
      const { driverId, status } = data;
      
      io.emit(socketEvents.driverStatusUpdate, {
        driverId,
        status,
        timestamp: new Date()
      });
    });

    socket.on('typing', (data) => {
      socket.to(data.rideId).emit('typing', {
        userId: socket.userId,
        userType: socket.userType,
        isTyping: data.isTyping
      });
    });

    socket.on('message', (data) => {
      socket.to(data.rideId).emit('message', {
        userId: socket.userId,
        userType: socket.userType,
        message: data.message,
        timestamp: new Date()
      });
    });

    socket.on(socketEvents.disconnect, () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.userId && socket.userType) {
        io.emit(`${socket.userType}-disconnected`, {
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });
  });
};

module.exports = {
  socketEvents,
  handleSocketConnection
};