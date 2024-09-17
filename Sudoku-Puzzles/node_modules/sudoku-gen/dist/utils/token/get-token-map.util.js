"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenMap = void 0;
const sort_random_util_1 = require("../helper/sort-random.util");
const getTokenMap = () => 'abcdefghi'
    .split('')
    .sort(sort_random_util_1.sortRandom)
    .reduce((acc, token, index) => ({
    ...acc,
    [token]: String(index + 1),
}), {});
exports.getTokenMap = getTokenMap;
