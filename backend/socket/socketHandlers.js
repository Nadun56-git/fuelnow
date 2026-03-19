/**
 * Socket.io Event Handlers
 * Manages real-time communication between server and clients
 */

// Store connected clients (optional - for analytics or admin features)
const connectedClients = new Map();

/**
 * Initialize Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const clientId = socket.id;
    const clientInfo = {
      id: clientId,
      connectedAt: new Date(),
      userAgent: socket.handshake.headers['user-agent'],
      ip: socket.handshake.address
    };
    
    // Store client info
    connectedClients.set(clientId, clientInfo);
    
    console.log(`🔌 Client connected: ${clientId}`);
    console.log(`📊 Total connected clients: ${connectedClients.size}`);
    
    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to FuelNow real-time updates',
      clientId,
      timestamp: new Date().toISOString()
    });
    
    // Handle client joining a room (for future feature: station-specific updates)
    socket.on('subscribe', (data) => {
      if (data && data.stationId) {
        const roomName = `station:${data.stationId}`;
        socket.join(roomName);
        console.log(`📡 Client ${clientId} subscribed to ${roomName}`);
        socket.emit('subscribed', { stationId: data.stationId });
      }
    });
    
    // Handle client leaving a room
    socket.on('unsubscribe', (data) => {
      if (data && data.stationId) {
        const roomName = `station:${data.stationId}`;
        socket.leave(roomName);
        console.log(`📡 Client ${clientId} unsubscribed from ${roomName}`);
        socket.emit('unsubscribed', { stationId: data.stationId });
      }
    });
    
    // Handle ping from client (keep-alive)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
    
    // Handle client requesting current stats
    socket.on('getStats', () => {
      socket.emit('stats', {
        connectedClients: connectedClients.size,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      connectedClients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId} (${reason})`);
      console.log(`📊 Total connected clients: ${connectedClients.size}`);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for client ${clientId}:`, error);
    });
  });
  
  // Log server-level events
  io.engine.on('connection_error', (err) => {
    console.error('❌ Connection error:', err.req, err.code, err.message, err.context);
  });
};

/**
 * Emit fuel update to all connected clients
 * @param {Server} io - Socket.io server instance
 * @param {Object} data - Update data
 */
const emitFuelUpdate = (io, data) => {
  io.emit('fuelUpdated', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit fuel update to specific station subscribers
 * @param {Server} io - Socket.io server instance
 * @param {string} stationId - Station ID
 * @param {Object} data - Update data
 */
const emitStationUpdate = (io, stationId, data) => {
  const roomName = `station:${stationId}`;
  io.to(roomName).emit('fuelUpdated', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Broadcast message to all clients
 * @param {Server} io - Socket.io server instance
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const broadcast = (io, event, data) => {
  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Get connected client count
 * @returns {number} Number of connected clients
 */
const getConnectedClientCount = () => {
  return connectedClients.size;
};

/**
 * Get connected clients info (for admin/debugging)
 * @returns {Array} Array of client info objects
 */
const getConnectedClients = () => {
  return Array.from(connectedClients.values());
};

module.exports = {
  initializeSocketHandlers,
  emitFuelUpdate,
  emitStationUpdate,
  broadcast,
  getConnectedClientCount,
  getConnectedClients
};
