"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleLayoutRows = void 0;
const get_layout_bands_util_1 = require("./get-layout-bands.util");
const sort_random_util_1 = require("../helper/sort-random.util");
const shuffleLayoutRows = (layout) => (0, get_layout_bands_util_1.getLayoutBands)(layout)
    .map((rows) => rows.sort(sort_random_util_1.sortRandom))
    .flat();
exports.shuffleLayoutRows = shuffleLayoutRows;
