const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// Serve a basic endpoint for health checks
app.get('/', (req, res) => res.send('Socket.IO Server for Neon Adventure'));

// Store rooms and their states
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining a room
    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], level: null };
        }
        if (rooms[roomId].players.length >= 2) {
            socket.emit('roomFull', 'This room is full. Try another room.');
            return;
        }
        socket.join(roomId);
        rooms[roomId].players.push({ id: socket.id, playerNumber: rooms[roomId].players.length + 1 });
        socket.emit('playerNumber', rooms[roomId].players.length);

        // If two players are in the room, start the game
        if (rooms[roomId].players.length === 2) {
            io.to(roomId).emit('startGame', rooms[roomId].players);
        }
    });

    // Handle player position and state updates
    socket.on('playerUpdate', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            socket.to(roomId).emit('updatePlayer', {
                playerId: socket.id,
                pos: data.pos,
                speed: data.speed,
                skin: data.skin,
                direction: data.direction,
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
                isMoving: data.isMoving,
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

    // Handle level state synchronization
    socket.on('levelState', (data) => {
        const roomId = data.roomId;
        if (rooms[roomId]) {
            rooms[roomId].level = data.level;
            io.to(roomId).emit('syncLevel', data.level);
        }
    });

    // Handle player death
    socket.on('playerDied', () => {
        const roomId = Array.from(socket.rooms).find(room => room !== socket.id);
        if (roomId && rooms[roomId]) {
            io.to(roomId).emit('playerDied');
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