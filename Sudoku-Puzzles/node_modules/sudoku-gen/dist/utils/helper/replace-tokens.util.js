"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceTokens = void 0;
const replaceTokens = (sequence, tokenMap) => sequence
    .split('')
    .map((token) => tokenMap[token] || token)
    .join('');
exports.replaceTokens = replaceTokens;
