function readVoltage(batteryType = 'AA') {
    const voltages = { AA: 1.5, AAA: 1.2, '9V': 9.0 };
    const fluctuation = (Math.random() * 0.1 - 0.05).toFixed(2);  // ±0.05V
    return (voltages[batteryType] + parseFloat(fluctuation)).toFixed(2);
}

function measureResistance(resistorOhms) {
    return `${resistorOhms} Ω`;
}

function checkContinuity(pathResistance) {
    return pathResistance < 10
        ? '📶 Beep! Continuity OK ✅'
        : '🔇 No Continuity ❌';
}

module.exports = { readVoltage, measureResistance, checkContinuity };
