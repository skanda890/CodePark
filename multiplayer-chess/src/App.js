import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Chessboard from 'react-chessboard';
import Chess from 'chess.js';

const socket = io('http://localhost:4000');

function App() {
    const [game, setGame] = useState(new Chess());

    useEffect(() => {
        socket.on('move', (move) => {
            const newGame = { ...game };
            newGame.move(move);
            setGame(newGame);
        });
    }, [game]);

    const handleMove = (move) => {
        const newGame = { ...game };
        const result = newGame.move(move);
        if (result) {
            setGame(newGame);
            socket.emit('move', move);
        }
    };

    return (
        <div className="App">
            <Chessboard
                position={game.fen()}
                onDrop={(move) => handleMove({
                    from: move.sourceSquare,
                    to: move.targetSquare,
                    promotion: 'q'
                })}
            />
        </div>
    );
}

export default App;
