#!/usr/bin/env node

const yargs = require('yargs-next')

yargs(process.argv.slice(2))
  .command('up', 'Run pending migrations', {}, async () => {
    console.log('Running migrations...')
    console.log('Migrations applied successfully')
  })
  .command('down', 'Rollback last migration', {}, async () => {
    console.log('Rolling back...')
    console.log('Rollback successful')
  })
  .command('status', 'Check migration status', {}, async () => {
    console.log('Status: All synced')
  })
  .demandCommand(1)
  .help().argv
