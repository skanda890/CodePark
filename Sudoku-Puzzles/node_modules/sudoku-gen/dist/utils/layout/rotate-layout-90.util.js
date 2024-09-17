"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateLayout90 = void 0;
const rotateLayout90 = (layout) => layout[0].map((_row, index) => layout.map((row) => row[index]).reverse());
exports.rotateLayout90 = rotateLayout90;
