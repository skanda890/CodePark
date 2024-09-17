import { Difficulty } from '../../types/difficulty.type';
import { Sudoku } from '../../types/sudoku.type';
export declare const getSeedsByDifficulty: (seeds: Sudoku[], difficulty?: Difficulty | undefined) => Sudoku[];
