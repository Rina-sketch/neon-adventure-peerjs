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
    console.log(`Клиент ${socket.id} пытается подключиться к комнате ${roomId}`);
    socket.join(roomId);
    // Уведомляем хоста о подключении клиента
    io.to(roomId).emit('playerJoined', socket.id);
    console.log(`Клиент ${socket.id} успешно подключился к комнате ${roomId}`);
  });

  socket.on('hostReady', (roomId) => {
    console.log(`Хост ${socket.id} готов в комнате ${roomId}`);
    io.to(roomId).emit('hostReady');
  });

  socket.on('clientReady', (data) => {
    console.log(`Клиент ${socket.id} готов, отправка данных хосту`);
    if (socket.rooms.size > 1) {
      const roomId = Array.from(socket.rooms)[1]; // Получаем ID комнаты
      io.to(roomId).emit('clientReady', data);
    }
  });

  socket.on('gameData', (roomId, data) => {
    console.log(`Передача данных в комнату ${roomId}:`, data.type);
    socket.to(roomId).emit('gameData', data);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключился:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});