"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleLayoutBands = void 0;
const get_layout_bands_util_1 = require("./get-layout-bands.util");
const sort_random_util_1 = require("../helper/sort-random.util");
const shuffleLayoutBands = (layout) => (0, get_layout_bands_util_1.getLayoutBands)(layout).sort(sort_random_util_1.sortRandom).flat();
exports.shuffleLayoutBands = shuffleLayoutBands;
