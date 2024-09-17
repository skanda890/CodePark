"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeedsByDifficulty = void 0;
const getSeedsByDifficulty = (seeds, difficulty) => seeds.filter((seed) => !difficulty || seed.difficulty === difficulty);
exports.getSeedsByDifficulty = getSeedsByDifficulty;
