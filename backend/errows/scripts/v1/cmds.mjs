export default {
  command: 'v1',
  describe: 'migration data from v1',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
};