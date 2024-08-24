const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let players = {};
let board = Array(9).fill(null);
let currentPlayer = 'X';

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign player
    if (Object.keys(players).length < 2) {
        players[socket.id] = Object.keys(players).length === 0 ? 'X' : 'O';
        socket.emit('player', players[socket.id]);
    } else {
        socket.emit('full', 'Game is full');
    }

    socket.on('move', (index) => {
        if (board[index] === null && players[socket.id] === currentPlayer) {
            board[index] = currentPlayer;
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            io.emit('board', board);
            io.emit('currentPlayer', currentPlayer);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        delete players[socket.id];
        board = Array(9).fill(null);
        currentPlayer = 'X';
        io.emit('board', board);
        io.emit('currentPlayer', currentPlayer);
    });
});

app.use(express.static('public'));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
