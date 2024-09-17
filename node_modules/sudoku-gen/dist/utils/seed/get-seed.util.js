"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeed = void 0;
const get_random_item_util_1 = require("../helper/get-random-item.util");
const get_seeds_by_difficulty_util_1 = require("./get-seeds-by-difficulty.util");
const getSeed = (seeds, difficulty) => (0, get_random_item_util_1.getRandomItem)((0, get_seeds_by_difficulty_util_1.getSeedsByDifficulty)(seeds, difficulty));
exports.getSeed = getSeed;
