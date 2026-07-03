export default {
  command: 'user',
  describe: 'user ops',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
  .showHelpOnFail(true),
};