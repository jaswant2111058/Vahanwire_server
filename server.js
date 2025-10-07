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
  console.log(`\n🌐 API REQUEST:`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Query:`, req.query);
  console.log(`Body:`, req.body);
  console.log(`IP: ${req.ip}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    console.log(`\n📤 API RESPONSE:`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response Data:`, data);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
    originalSend.call(this, data);
  };
  
  res.json = function(data) {
    console.log(`\n📤 API RESPONSE:`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(data, null, 2));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
    originalJson.call(this, data);
  };
  
  console.log('─'.repeat(50));
  next();
});

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

app.get('/', (req, res) => {
  res.send('System API is running');
});

app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bidding', biddingRoutes);

io.on('connection', (socket) => {
  console.log(`\n🔌 SOCKET CONNECTION:`);
  console.log(`Socket ID: ${socket.id}`);
  console.log(`Client IP: ${socket.handshake.address}`);
  console.log(`User Agent: ${socket.handshake.headers['user-agent']}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('─'.repeat(50));

  socket.on('join-room', (roomData) => {
    console.log(`\n📥 SOCKET EVENT - JOIN ROOM:`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Event: join-room`);
    console.log(`Data:`, roomData);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
    
    socket.join(roomData.roomId);
    console.log(`✅ Socket ${socket.id} joined room ${roomData.roomId}`);
  });

  socket.on('place-bid', (bidData) => {
    console.log(`\n📥 SOCKET EVENT - PLACE BID:`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Event: place-bid`);
    console.log(`Data:`, JSON.stringify(bidData, null, 2));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
    
    socket.to(bidData.rideId).emit('new-bid', bidData);
    
    console.log(`📤 SOCKET EMIT - NEW BID:`);
    console.log(`To Room: ${bidData.rideId}`);
    console.log(`Event: new-bid`);
    console.log(`Data:`, JSON.stringify(bidData, null, 2));
  });

  socket.on('accept-bid', (acceptData) => {
    console.log(`\n📥 SOCKET EVENT - ACCEPT BID:`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Event: accept-bid`);
    console.log(`Data:`, JSON.stringify(acceptData, null, 2));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
    
    socket.to(acceptData.rideId).emit('bid-accepted', acceptData);
    
    console.log(`📤 SOCKET EMIT - BID ACCEPTED:`);
    console.log(`To Room: ${acceptData.rideId}`);
    console.log(`Event: bid-accepted`);
    console.log(`Data:`, JSON.stringify(acceptData, null, 2));
  });

  socket.onAny((eventName, ...args) => {
    console.log(`\n📥 SOCKET EVENT - ${eventName.toUpperCase()}:`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Event: ${eventName}`);
    console.log(`Arguments:`, args);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
  });

  socket.on('disconnect', (reason) => {
    console.log(`\n🔌 SOCKET DISCONNECTION:`);
    console.log(`Socket ID: ${socket.id}`);
    console.log(`Reason: ${reason}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(50));
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