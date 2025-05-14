const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

app.get('/', (req, res) => res.send('Socket.IO Server'));

const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Обработка создания/присоединения к комнате
    socket.on('join', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], gameState: null };
            console.log(`Room ${roomId} created`);
        }
        
        if (rooms[roomId].players.length >= 2) {
            socket.emit('roomFull', 'Комната заполнена. Максимум 2 игрока.');
            return;
        }
        
        socket.join(roomId);
        const playerNumber = rooms[roomId].players.length + 1;
        rooms[roomId].players.push(socket.id);
        socket.emit('playerNumber', playerNumber);
        
        console.log(`Player ${socket.id} joined room ${roomId} as player ${playerNumber}`);
        
        if (rooms[roomId].players.length === 2) {
            io.to(roomId).emit('startGame', { 
                roomId: roomId,
                players: rooms[roomId].players 
            });
        }
    });

    // Обработка обновлений игрока
    socket.on('playerUpdate', (data) => {
        socket.to(data.roomId).emit('playerUpdate', {
            playerId: socket.id,
            pos: data.pos,
            speed: data.speed,
            direction: data.direction,
            keys: data.keys,
            lives: data.lives
        });
    });

    // Обработка сбора ключей
    socket.on('keyCollected', (data) => {
        io.to(data.roomId).emit('keyCollected', {
            playerId: socket.id,
            keyIndex: data.keyIndex,
            totalKeys: data.totalKeys
        });
    });

    // Обработка открытия дверей
    socket.on('doorUnlocked', (data) => {
        io.to(data.roomId).emit('doorUnlocked', {
            doorIndex: data.doorIndex
        });
    });

    // Обработка открытия сундуков
    socket.on('chestOpened', (data) => {
        io.to(data.roomId).emit('chestOpened', {
            chestIndex: data.chestIndex,
            playerId: socket.id
        });
    });

    // Обработка поражения врагов
    socket.on('enemyDefeated', (data) => {
        io.to(data.roomId).emit('enemyDefeated', {
            enemyIndex: data.enemyIndex,
            playerId: socket.id
        });
    });

    // Обработка смерти игрока
    socket.on('playerDied', (data) => {
        io.to(data.roomId).emit('playerDied', {
            playerId: socket.id
        });
    });

    // Обработка завершения уровня
    socket.on('levelComplete', (data) => {
        io.to(data.roomId).emit('levelComplete');
    });

    // Обработка отключения игрока
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const index = rooms[roomId].players.indexOf(socket.id);
            if (index !== -1) {
                rooms[roomId].players.splice(index, 1);
                io.to(roomId).emit('playerDisconnected', socket.id);
                console.log(`Player ${socket.id} disconnected from room ${roomId}`);
                
                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} deleted (no players)`);
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));