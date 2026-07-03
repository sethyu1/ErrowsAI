export default {
  command: 'payment',
  describe: 'payment ops',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
  .showHelpOnFail(true),
};