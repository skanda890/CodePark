"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardToSequence = void 0;
const boardToSequence = (board) => board.map((row) => row.join('')).join('');
exports.boardToSequence = boardToSequence;
