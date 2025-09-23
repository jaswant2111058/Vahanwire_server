require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const os = require('os');

const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const rideRoutes = require('./routes/rideRoutes');
const biddingRoutes = require('./routes/biddingRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 6600;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bidding', biddingRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('place-bid', (bidData) => {
    socket.to(bidData.rideId).emit('new-bid', bidData);
  });

  socket.on('accept-bid', (acceptData) => {
    socket.to(acceptData.rideId).emit('bid-accepted', acceptData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const getLocalIPv4Address = () => {
  const ifaces = os.networkInterfaces();
  for (const iface in ifaces) {
    for (const details of ifaces[iface]) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
};

const ipAddress = getLocalIPv4Address();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (ipAddress) {
    console.log(`Server also accessible at http://${ipAddress}:${PORT}`);
  }
});

module.exports = app;