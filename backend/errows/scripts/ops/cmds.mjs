export default {
  command: 'ops',
  describe: 'ops',
  builder: (yargs) => yargs
  .commandDir('.', { excludes: ['cmd.mjs'] })
  .demandCommand()
  .help()
  .showHelpOnFail(true),
};