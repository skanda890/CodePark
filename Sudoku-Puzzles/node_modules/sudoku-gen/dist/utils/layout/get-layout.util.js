"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayout = void 0;
const rotate_layout_util_1 = require("./rotate-layout.util");
const shuffle_layout_util_1 = require("./shuffle-layout.util");
const getLayout = (baseLayout) => (0, shuffle_layout_util_1.shuffleLayout)((0, rotate_layout_util_1.rotateLayout)(baseLayout));
exports.getLayout = getLayout;
