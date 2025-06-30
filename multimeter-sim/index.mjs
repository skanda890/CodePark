import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import { readVoltage, measureResistance, checkContinuity } from './multimeter.mjs';

const readings = [];

function logReading(type, value) {
  const entry = `${new Date().toISOString()},${type},${value}`;
  readings.push(entry);
  fs.appendFileSync('readings.csv', entry + '\n');
}

function drawDial(mode) {
  console.log(chalk.gray('\n[🔘] Dial set to:'), chalk.magenta.bold(mode));
}

async function start() {
  console.clear();
  console.log(chalk.cyan.bold('\n🔧 Virtual Multimeter Simulator\n'));

  const { mode } = await inquirer.prompt({
    type: 'list',
    name: 'mode',
    message: 'Select a mode:',
    choices: ['Read Voltage', 'Measure Resistance', 'Check Continuity'],
  });

  drawDial(mode);

  if (mode === 'Read Voltage') {
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'Select battery type:',
      choices: ['AA', 'AAA', '9V'],
    });
    const voltage = readVoltage(type);
    console.log(chalk.green(`🔋 Voltage of ${type}: ${voltage} V`));
    logReading('Voltage', voltage);
  }

  if (mode === 'Measure Resistance') {
    const { ohms } = await inquirer.prompt({
      type: 'input',
      name: 'ohms',
      message: 'Enter resistor value (in ohms):',
      validate: val => !isNaN(val) || 'Enter a number',
    });
    const result = measureResistance(ohms);
    console.log(chalk.yellow(`📏 Resistance: ${result}`));
    logReading('Resistance', ohms);
  }

  if (mode === 'Check Continuity') {
    const { resistance } = await inquirer.prompt({
      type: 'input',
      name: 'resistance',
      message: 'Enter resistance of path:',
      validate: val => !isNaN(val) || 'Enter a number',
    });
    const result = checkContinuity(parseFloat(resistance));
    console.log(chalk.blue(`${result}`));
    logReading('Continuity', resistance);
  }

  const { again } = await inquirer.prompt({
    type: 'confirm',
    name: 'again',
    message: 'Do you want to test another mode?',
  });

  if (again) start();
  else {
    console.log(chalk.cyanBright('\n📉 Session complete. Readings saved to readings.csv'));
    console.log(chalk.gray('Goodbye, engineer! 🧠🔌'));
  }
}

start();
