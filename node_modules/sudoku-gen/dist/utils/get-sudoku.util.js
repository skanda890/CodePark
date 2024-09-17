"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSudoku = void 0;
const base_layout_constant_1 = require("../constants/base-layout.constant");
const difficulty_levels_constant_1 = require("../constants/difficulty-levels.constant");
const get_layout_util_1 = require("./layout/get-layout.util");
const get_seed_util_1 = require("./seed/get-seed.util");
const get_sequence_util_1 = require("./helper/get-sequence.util");
const get_token_map_util_1 = require("./token/get-token-map.util");
const seeds_constant_1 = require("../constants/seeds.constant");
const validate_difficulty_util_1 = require("./validate/validate-difficulty.util");
const getSudoku = (difficulty) => {
    if (difficulty && !(0, validate_difficulty_util_1.validateDifficulty)(difficulty)) {
        throw new Error(`Invalid difficulty, expected one of: ${difficulty_levels_constant_1.DIFFICULTY_LEVELS.join(', ')}`);
    }
    const seed = (0, get_seed_util_1.getSeed)(seeds_constant_1.SEEDS, difficulty);
    const layout = (0, get_layout_util_1.getLayout)(base_layout_constant_1.BASE_LAYOUT);
    const tokenMap = (0, get_token_map_util_1.getTokenMap)();
    const puzzle = (0, get_sequence_util_1.getSequence)(layout, seed.puzzle, tokenMap);
    const solution = (0, get_sequence_util_1.getSequence)(layout, seed.solution, tokenMap);
    return {
        puzzle,
        solution,
        difficulty: seed.difficulty,
    };
};
exports.getSudoku = getSudoku;
