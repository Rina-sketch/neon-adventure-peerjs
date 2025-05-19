const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

app.get('/', (req, res) => res.send('Socket.IO Server'));

const rooms = {};

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Initialize room for host
    rooms[socket.id] = { players: [socket.id] };
    socket.join(socket.id);

    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) {
            socket.emit('roomError', 'Room does not exist');
            socket.disconnect();
            return;
        }

        if (rooms[roomId].players.length >= 2) {
            socket.emit('roomFull', 'Room is full');
            socket.disconnect();
            return;
        }

        socket.join(roomId);
        rooms[roomId].players.push(socket.id);
        socket.to(roomId).emit('playerJoined', socket.id);
    });

    socket.on('sendState', (data) => {
        io.to(data.target).emit('gameState', data.state);
    });

    socket.on('playerUpdate', (data) => {
        socket.to(data.roomId).emit('playerUpdate', data);
    });

    socket.on('keyDown', (data) => {
        socket.to(data.roomId).emit('keyDown', data);
    });

    socket.on('keyUp', (data) => {
        socket.to(data.roomId).emit('keyUp', data);
    });

    socket.on('keyCollected', (data) => {
        io.in(data.roomId).emit('keyCollected', data);
    });

    socket.on('doorUnlocked', (data) => {
        io.in(data.roomId).emit('doorUnlocked', data);
    });

    socket.on('chestOpened', (data) => {
        io.in(data.roomId).emit('chestOpened', data);
    });

    socket.on('enemyDefeated', (data) => {
        io.in(data.roomId).emit('enemyDefeated', data);
    });

    socket.on('playerDied', (data) => {
        io.in(data.roomId).emit('playerDied', data);
    });

    socket.on('loadLevel', (data) => {
        socket.to(data.roomId).emit('loadLevel', data);
    });

    socket.on('levelComplete', (data) => {
        io.in(data.roomId).emit('levelComplete');
    });

    socket.on('openPuzzle', (data) => {
        socket.to(data.roomId).emit('openPuzzle');
    });

    socket.on('openSkinMenu', (data) => {
        socket.to(data.roomId).emit('openSkinMenu');
    });

    socket.on('closeSkinMenu', (data) => {
        socket.to(data.roomId).emit('closeSkinMenu');
    });

    socket.on('dialogAdvance', (data) => {
        socket.to(data.roomId).emit('dialogAdvance', data);
    });

    socket.on('bossUpdate', (data) => {
        socket.to(data.roomId).emit('bossUpdate', data);
    });

    socket.on('bossProjectile', (data) => {
        socket.to(data.roomId).emit('bossProjectile', data);
    });

    socket.on('projectileRemoved', (data) => {
        socket.to(data.roomId).emit('projectileRemoved', data);
    });

    socket.on('enemiesUpdate', (data) => {
        socket.to(data.roomId).emit('enemiesUpdate', data);
    });

    socket.on('projectilesUpdate', (data) => {
        socket.to(data.roomId).emit('projectilesUpdate', data);
    });

    socket.on('puzzleAttempt', (data) => {
        io.in(data.roomId).emit('puzzleAttempt', data);
    });

    socket.on('puzzleSolved', (data) => {
        io.in(data.roomId).emit('puzzleSolved');
    });

    socket.on('puzzleReset', (data) => {
        io.in(data.roomId).emit('puzzleReset');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.indexOf(socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.in(roomId).emit('playerDisconnected', socket.id);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));