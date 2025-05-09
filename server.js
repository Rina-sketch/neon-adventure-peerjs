const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 9000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://neon-adventure-client.vercel.app'], // Replace with your Vercel URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('Socket.IO server for Neon Adventure is running!');
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (roomId) => {
    console.log(`Client ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
    io.to(roomId).emit('playerJoined', socket.id);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('hostReady', (roomId) => {
    console.log(`Host ${socket.id} ready in room ${roomId}`);
    io.to(roomId).emit('hostReady');
  });

  socket.on('clientReady', (data) => {
    console.log(`Client ${socket.id} ready`);
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      io.to(roomId).emit('clientReady', data);
    }
  });

  socket.on('gameData', (roomId, data) => {
    console.log(`Broadcasting game data to room ${roomId}: ${data.type} from ${socket.id}`);
    io.to(roomId).emit('gameData', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Notify rooms the client was in
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        io.to(room).emit('playerDisconnected', socket.id);
      }
    });
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});