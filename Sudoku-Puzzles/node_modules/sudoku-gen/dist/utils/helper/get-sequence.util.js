"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSequence = void 0;
const board_to_sequence_util_1 = require("./board-to-sequence.util");
const populate_layout_util_1 = require("../layout/populate-layout.util");
const replace_tokens_util_1 = require("./replace-tokens.util");
const getSequence = (layout, seedSequence, tokenMap) => (0, board_to_sequence_util_1.boardToSequence)((0, populate_layout_util_1.populateLayout)(layout, (0, replace_tokens_util_1.replaceTokens)(seedSequence, tokenMap)));
exports.getSequence = getSequence;
