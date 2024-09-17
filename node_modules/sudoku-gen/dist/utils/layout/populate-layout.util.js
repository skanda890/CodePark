"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateLayout = void 0;
const populateLayout = (layout, sequence) => layout.map((row) => row.map((cell) => sequence[cell]));
exports.populateLayout = populateLayout;
