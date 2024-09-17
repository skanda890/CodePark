"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDifficulty = void 0;
const difficulty_levels_constant_1 = require("../../constants/difficulty-levels.constant");
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const validateDifficulty = (difficulty) => difficulty_levels_constant_1.DIFFICULTY_LEVELS.includes(difficulty);
exports.validateDifficulty = validateDifficulty;
