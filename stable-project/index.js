const math = require('mathjs');

const a = math.complex(2, 3); // 2 + 3i
const b = math.complex('4 - 2i'); // 4 - 2i

console.log('a:', a.re, '+', a.im, 'i'); // 2 + 3i
console.log('b:', b.re, '+', b.im, 'i'); // 4 - 2i

const sum = math.add(a, b);
const product = math.multiply(a, b);
const conjugateA = math.conj(a);

console.log('Sum:', sum.toString()); // 6 + i
console.log('Product:', product.toString()); // 14 + 8i
console.log('Conjugate of a:', conjugateA.toString()); // 2 - 3i
