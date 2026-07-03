export default {
  command: 'migration',
  describe: 'Run database migrations',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
};