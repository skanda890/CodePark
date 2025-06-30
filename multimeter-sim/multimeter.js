function readVoltage(batteryType = 'AA') {
    const voltages = { AA: 1.5, AAA: 1.2, 9V: 9.0 };
    return voltages[batteryType] || 0;
}

function measureResistance(resistorOhms) {
    return `${resistorOhms} Ω`;
}

function checkContinuity(pathResistance) {
    return pathResistance < 10 ? 'Beep! Continuity OK ✅' : 'No Continuity ❌';
}

module.exports = { readVoltage, measureResistance, checkContinuity };
