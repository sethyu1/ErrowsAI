export default {
  command: 'character',
  describe: 'character ops',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
  .showHelpOnFail(false),
};