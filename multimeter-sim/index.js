const inquirer = require('inquirer');
const chalk = require('chalk');
const meter = require('./multimeter');

async function start() {
    console.log(chalk.cyan.bold('\n🔧 Virtual Multimeter Simulator\n'));

    const { mode } = await inquirer.prompt({
        type: 'list',
        name: 'mode',
        message: 'Select a mode:',
        choices: ['Read Voltage', 'Measure Resistance', 'Check Continuity'],
    });

    if (mode === 'Read Voltage') {
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: 'Select battery type:',
            choices: ['AA', 'AAA', '9V'],
        });
        const voltage = meter.readVoltage(type);
        console.log(chalk.green(`🔋 Voltage of ${type}: ${voltage} V`));
    }

    if (mode === 'Measure Resistance') {
        const { ohms } = await inquirer.prompt({
            type: 'input',
            name: 'ohms',
            message: 'Enter resistor value (in ohms):',
            validate: val => !isNaN(val) || 'Enter a number',
        });
        console.log(chalk.yellow(`📏 Resistance: ${meter.measureResistance(ohms)}`));
    }

    if (mode === 'Check Continuity') {
        const { resistance } = await inquirer.prompt({
            type: 'input',
            name: 'resistance',
            message: 'Enter resistance of path:',
            validate: val => !isNaN(val) || 'Enter a number',
        });
        console.log(chalk.blue(`${meter.checkContinuity(parseFloat(resistance))}`));
    }

    const { again } = await inquirer.prompt({
        type: 'confirm',
        name: 'again',
        message: 'Do you want to test another mode?',
    });

    if (again) start();
    else console.log(chalk.cyanBright('\n👋 Multimeter session ended.'));
}

start();
