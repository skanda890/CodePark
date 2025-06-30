const multimeter = require('./multimeter');

console.log('🔋 Simulating AA battery...');
console.log(`Voltage: ${multimeter.readVoltage('AA')} V`);

console.log('\n📏 Measuring resistance...');
console.log(`Resistance: ${multimeter.measureResistance(220)}`);

console.log('\n🔌 Checking continuity...');
console.log(multimeter.checkContinuity(5));
