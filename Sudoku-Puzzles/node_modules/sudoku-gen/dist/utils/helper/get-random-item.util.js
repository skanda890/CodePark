"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomItem = void 0;
const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];
exports.getRandomItem = getRandomItem;
