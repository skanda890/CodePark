"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateLayout180 = void 0;
const rotateLayout180 = (layout) => layout.map((row) => [...row].reverse()).reverse();
exports.rotateLayout180 = rotateLayout180;
