const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { connectDB } = require('./src/config/database');
const { setIo } = require('./src/socket/ioRegistry');
const { registerChatSockets } = require('./src/socket/chatSocket');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TailorConnect API is running' });
});

// Routes will be added here
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tailors', require('./src/routes/tailors'));
app.use('/api/search', require('./src/routes/search'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/conversations', require('./src/routes/conversations'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/home-visits', require('./src/routes/homeVisits'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/ai-assistant', require('./src/routes/aiAssistant'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
/** Listen on all interfaces so phones on the same Wi‑Fi can reach the API (Expo). */
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  await connectDB();
  setIo(io);
  registerChatSockets(io, app);
  httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
    console.log('   Use your computer LAN IP in EXPO_PUBLIC_API_URL (same Wi‑Fi as the device).');
    console.log('📡 Socket.io chat + presence ready');
  });
};

startServer();

module.exports = { app, io };


