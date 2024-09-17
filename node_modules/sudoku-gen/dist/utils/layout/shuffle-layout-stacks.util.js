"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleLayoutStacks = void 0;
const rotate_layout_270_util_1 = require("./rotate-layout-270.util");
const rotate_layout_90_util_1 = require("./rotate-layout-90.util");
const shuffle_layout_bands_util_1 = require("./shuffle-layout-bands.util");
const shuffleLayoutStacks = (layout) => (0, rotate_layout_270_util_1.rotateLayout270)((0, shuffle_layout_bands_util_1.shuffleLayoutBands)((0, rotate_layout_90_util_1.rotateLayout90)(layout)));
exports.shuffleLayoutStacks = shuffleLayoutStacks;
