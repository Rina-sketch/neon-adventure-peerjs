const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Serve a basic endpoint for health checks
app.get('/', (req, res) => res.send('Socket.IO Server'));

// Store rooms and their states
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining a room
    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], level: null, gameState: null };
        }
        if (rooms[roomId].players.length >= 2) {
            socket.emit('roomFull', 'This room is full. Try another room.');
            return;
        }
        socket.join(roomId);
        const playerNumber = rooms[roomId].players.length + 1;
        rooms[roomId].players.push({ id: socket.id, playerNumber });
        socket.emit('playerNumber', playerNumber);
        socket.emit('roomId', roomId); // Send room ID to client

        if (rooms[roomId].players.length === 2) {
            io.to(roomId).emit('startGame', rooms[roomId].players);
        }
    });

    // Handle player updates (position, skin, etc.)
    socket.on('playerUpdate', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            socket.to(roomId).emit('updatePlayer', {
                playerId: socket.id,
                pos: data.pos,
                skin: data.skin,
                direction: data.direction,
                isMoving: data.isMoving,
                keys: data.keys,
                lives: data.lives,
                hasSword: data.hasSword,
                invincible: data.invincible,
                invincibleTimer: data.invincibleTimer,
                hasPotion: data.hasPotion,
                damageMultiplier: data.damageMultiplier,
                catEars: data.catEars,
                earAngle: data.earAngle,
                tailAngle: data.tailAngle,
                attackCooldown: data.attackCooldown
            });
        }
    });

    // Handle key collection
    socket.on('keyCollected', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('removeKey', data.keyIndex);
        }
    });

    // Handle door unlocking
    socket.on('doorUnlocked', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('unlockDoor', data.doorIndex);
        }
    });

    // Handle chest opening
    socket.on('chestOpened', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('openChest', data.chestIndex);
        }
    });

    // Handle enemy defeat
    socket.on('enemyDefeated', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('removeEnemy', data.enemyIndex);
        }
    });

    // Handle boss defeat
    socket.on('bossDefeated', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('defeatBoss');
        }
    });

    // Handle puzzle solving
    socket.on('puzzleSolved', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('solvePuzzle');
        }
    });

    // Handle level state updates
    socket.on('levelState', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            rooms[roomId].level = data.level;
            rooms[roomId].gameState = data.gameState;
            io.to(roomId).emit('syncLevel', data);
        }
    });

    // Handle level completion
    socket.on('levelComplete', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('showLevelComplete');
        }
    });

    // Handle game over
    socket.on('gameOver', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            io.to(roomId).emit('showGameOver');
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(roomId).emit('playerDisconnected', socket.id);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));