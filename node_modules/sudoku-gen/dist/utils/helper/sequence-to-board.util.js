"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceToBoard = void 0;
const grid_size_constant_1 = require("../../constants/grid-size.constant");
const line_container_constant_1 = require("../../constants/line-container.constant");
const sequenceToBoard = (sequence) => sequence.split('').reduce((acc, token, tokenIndex) => {
    const tokenRowIndex = Math.floor(tokenIndex / grid_size_constant_1.GRID_SIZE);
    return acc.map((row, rowIndex) => (rowIndex === tokenRowIndex ? [...row, token] : row));
}, line_container_constant_1.LINE_CONTAINER);
exports.sequenceToBoard = sequenceToBoard;
