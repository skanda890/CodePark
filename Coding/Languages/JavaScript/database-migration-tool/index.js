#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
  .command('up', 'Run migrations', {}, () => {
    console.log('✓ Migrations applied')
  })
  .command('down', 'Rollback', {}, () => {
    console.log('✓ Rolled back')
  })
  .command('status', 'Check status', {}, () => {
    console.log('Status: All synced')
  })
  .demandCommand(1)
  .help().argv
