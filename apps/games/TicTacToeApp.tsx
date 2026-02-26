import React, { useState } from 'react';

type Player = 'X' | 'O' | null;

const TicTacToeApp: React.FC = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) {
      return;
    }
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(square => square !== null);

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (isDraw) {
    status = 'Draw!';
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-3 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-purple-400">Tic Tac Toe</h1>
      <div className="text-lg sm:text-xl mb-3 sm:mb-4 h-7 sm:h-8">{status}</div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {board.map((square, i) => (
          <button
            key={i}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 border-2 border-slate-700 rounded-lg text-3xl sm:text-4xl font-bold flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors"
            onClick={() => handleClick(i)}
          >
            <span className={square === 'X' ? 'text-blue-400' : 'text-red-400'}>
              {square}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={resetGame}
        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-md font-semibold transition-colors"
      >
        Restart Game
      </button>
    </div>
  );
};

export default TicTacToeApp;
