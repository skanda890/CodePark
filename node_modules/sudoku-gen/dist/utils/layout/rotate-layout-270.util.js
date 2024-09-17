"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateLayout270 = void 0;
const rotateLayout270 = (layout) => layout[0].map((_row, index) => layout.map((row) => [...row].reverse()[index]));
exports.rotateLayout270 = rotateLayout270;
