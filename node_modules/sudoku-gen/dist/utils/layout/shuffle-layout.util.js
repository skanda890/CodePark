"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleLayout = void 0;
const shuffle_layout_bands_util_1 = require("./shuffle-layout-bands.util");
const shuffle_layout_columns_util_1 = require("./shuffle-layout-columns.util");
const shuffle_layout_rows_util_1 = require("./shuffle-layout-rows.util");
const shuffle_layout_stacks_util_1 = require("./shuffle-layout-stacks.util");
const shuffleLayout = (layout) => (0, shuffle_layout_columns_util_1.shuffleLayoutColumns)((0, shuffle_layout_rows_util_1.shuffleLayoutRows)((0, shuffle_layout_stacks_util_1.shuffleLayoutStacks)((0, shuffle_layout_bands_util_1.shuffleLayoutBands)(layout))));
exports.shuffleLayout = shuffleLayout;
