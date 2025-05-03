const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 9000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Разрешить подключения от всех источников (для теста)
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('Socket.IO сервер для Неоновой Бродилки запущен!');
});

io.on('connection', (socket) => {
  console.log('Клиент подключился:', socket.id);

  socket.on('join', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('playerJoined', socket.id);
  });

  socket.on('gameData', (roomId, data) => {
    socket.to(roomId).emit('gameData', data);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключился:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});